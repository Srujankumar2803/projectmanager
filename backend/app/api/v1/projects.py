from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.models.team import Team
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.api.dependencies import get_current_user

router = APIRouter()


@router.get("/", response_model=List[ProjectOut])
async def list_projects(
    status_filter: Optional[str] = Query(None, description="Filter by status: active or completed"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List projects based on user role:
    - Admins: can see all projects
    - Managers: can see projects they manage
    - Members: can see projects from their teams
    """
    query = db.query(Project)
    
    # Apply role-based filtering
    if current_user.role == UserRole.admin:
        # Admins see all projects
        pass
    elif current_user.role == UserRole.manager:
        # Managers see only projects they manage
        query = query.filter(Project.manager_id == current_user.id)
    else:
        # Members see projects from teams they're part of
        # For now, allow them to see all (you can customize this based on team membership)
        pass
    
    # Apply status filter if provided
    if status_filter:
        if status_filter not in ["active", "completed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be 'active' or 'completed'"
            )
        query = query.filter(Project.status == ProjectStatus(status_filter))
    
    projects = query.all()
    return projects


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.admin and project.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this project"
        )
    
    return project


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new project. Only managers and admins can create projects.
    Managers can only create projects for teams they manage.
    """
    # Only managers and admins can create projects
    if current_user.role not in [UserRole.manager, UserRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can create projects"
        )
    
    # Verify team exists
    team = db.query(Team).filter(Team.id == project_data.team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Managers can only create projects for teams they created (or any team for admins)
    if current_user.role == UserRole.manager and team.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create projects for teams you manage"
        )
    
    project = Project(
        name=project_data.name,
        description=project_data.description,
        team_id=project_data.team_id,
        manager_id=current_user.id,  # Current user becomes the manager
        status=ProjectStatus(project_data.status),
        start_date=project_data.start_date,
        end_date=project_data.end_date
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return project


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a project. Only the project manager or admins can update.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Only project manager or admin can update
    if current_user.role != UserRole.admin and project.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project manager or admins can update this project"
        )
    
    # Update fields
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.team_id is not None:
        # Verify team exists
        team = db.query(Team).filter(Team.id == project_data.team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found"
            )
        project.team_id = project_data.team_id
    if project_data.status is not None:
        project.status = ProjectStatus(project_data.status)
    if project_data.start_date is not None:
        project.start_date = project_data.start_date
    if project_data.end_date is not None:
        project.end_date = project_data.end_date
    
    db.commit()
    db.refresh(project)
    
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a project. Only admins can delete projects.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete projects"
        )
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(project)
    db.commit()
    
    return None
