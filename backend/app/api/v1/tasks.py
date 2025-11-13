from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.api.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.task import Task, TaskStatus
from app.models.project import Project
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(tags=["tasks"])


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List tasks for the current user.
    - Members see only their assigned tasks
    - Managers see tasks in their projects
    - Admins see all tasks
    """
    query = db.query(Task)
    
    if current_user.role == UserRole.member:
        # Members see only tasks assigned to them
        query = query.filter(Task.assigned_to == current_user.id)
    elif current_user.role == UserRole.manager:
        # Managers see tasks in projects they manage
        managed_project_ids = db.query(Project.id).filter(
            Project.manager_id == current_user.id
        ).all()
        managed_project_ids = [p[0] for p in managed_project_ids]
        
        # Also include tasks assigned to them
        query = query.filter(
            (Task.project_id.in_(managed_project_ids)) | 
            (Task.assigned_to == current_user.id)
        )
    # Admins see all tasks (no filter needed)
    
    # Apply status filter if provided
    if status_filter and status_filter != "all":
        try:
            status_enum = TaskStatus[status_filter.upper()]
            query = query.filter(Task.status == status_enum)
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter: {status_filter}"
            )
    
    tasks = query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).all()
    
    # Convert enum to string for JSON serialization
    for task in tasks:
        task.status = task.status.value
    
    return tasks


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.manager, UserRole.admin]))
):
    """
    Create a new task. Only managers and admins can create tasks.
    Managers can only create tasks for projects they manage.
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == task_data.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Managers can only create tasks for their own projects
    if current_user.role == UserRole.manager and project.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create tasks for projects you manage"
        )
    
    # Verify assignee exists
    assignee = db.query(User).filter(User.id == task_data.assigned_to).first()
    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned user not found"
        )
    
    # Validate and convert status string to enum
    try:
        status_enum = TaskStatus[task_data.status.upper()]
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {task_data.status}. Must be one of: todo, in_progress, done"
        )
    
    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        project_id=task_data.project_id,
        assigned_to=task_data.assigned_to,
        status=status_enum,
        due_date=task_data.due_date
    )
    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Convert enum to string for JSON serialization
    new_task.status = new_task.status.value
    
    return new_task


@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a task.
    - Members can only update status of their own tasks
    - Managers can update tasks in their projects
    - Admins can update any task
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.member:
        # Members can only update their own tasks, and only the status
        if task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own tasks"
            )
        # Members can only update status
        if task_data.title or task_data.description or task_data.assigned_to or task_data.due_date:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Members can only update task status"
            )
    elif current_user.role == UserRole.manager:
        # Managers can update tasks in their projects
        project = db.query(Project).filter(Project.id == task.project_id).first()
        if project.manager_id != current_user.id and task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update tasks in your projects or assigned to you"
            )
    # Admins can update any task (no additional check needed)
    
    # Update fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.assigned_to is not None:
        # Verify new assignee exists
        assignee = db.query(User).filter(User.id == task_data.assigned_to).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found"
            )
        task.assigned_to = task_data.assigned_to
    if task_data.status is not None:
        # Validate and convert status string to enum
        try:
            status_enum = TaskStatus[task_data.status.upper()]
            task.status = status_enum
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {task_data.status}. Must be one of: todo, in_progress, done"
            )
    if task_data.due_date is not None:
        task.due_date = task_data.due_date
    
    db.commit()
    db.refresh(task)
    
    # Convert enum to string for JSON serialization
    task.status = task.status.value
    
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.admin]))
):
    """
    Delete a task. Only admins can delete tasks.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db.delete(task)
    db.commit()
    
    return None
