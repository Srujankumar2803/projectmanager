from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskStatus
from app.models.team import Team
from app.schemas.stats import StatsOverview, ProjectStats, TaskStats

router = APIRouter(tags=["stats"])


@router.get("/overview", response_model=StatsOverview)
def get_stats_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics overview for the current user.
    - Admins see all stats
    - Managers see stats for their projects/teams
    - Members see stats for tasks assigned to them
    """
    
    # Project stats
    project_query = db.query(Project)
    
    if current_user.role == UserRole.manager:
        # Managers see only their projects
        project_query = project_query.filter(Project.manager_id == current_user.id)
    elif current_user.role == UserRole.member:
        # Members see projects they have tasks in
        member_project_ids = db.query(Task.project_id).filter(
            Task.assigned_to == current_user.id
        ).distinct().all()
        member_project_ids = [p[0] for p in member_project_ids]
        project_query = project_query.filter(Project.id.in_(member_project_ids))
    
    # Count projects by status
    total_projects = project_query.count()
    active_projects = project_query.filter(Project.status == ProjectStatus.active).count()
    completed_projects = project_query.filter(Project.status == ProjectStatus.completed).count()
    
    # Task stats
    task_query = db.query(Task)
    
    if current_user.role == UserRole.member:
        # Members see only their tasks
        task_query = task_query.filter(Task.assigned_to == current_user.id)
    elif current_user.role == UserRole.manager:
        # Managers see tasks in their projects + tasks assigned to them
        managed_project_ids = db.query(Project.id).filter(
            Project.manager_id == current_user.id
        ).all()
        managed_project_ids = [p[0] for p in managed_project_ids]
        
        task_query = task_query.filter(
            (Task.project_id.in_(managed_project_ids)) | 
            (Task.assigned_to == current_user.id)
        )
    
    # Count tasks by status
    total_tasks = task_query.count()
    todo_tasks = task_query.filter(Task.status == TaskStatus.TODO).count()
    in_progress_tasks = task_query.filter(Task.status == TaskStatus.IN_PROGRESS).count()
    done_tasks = task_query.filter(Task.status == TaskStatus.DONE).count()
    
    # Team and user counts (all users see all teams and users)
    total_teams = db.query(Team).count()
    total_users = db.query(User).count()
    
    return StatsOverview(
        projects=ProjectStats(
            active=active_projects,
            completed=completed_projects,
            total=total_projects
        ),
        tasks=TaskStats(
            todo=todo_tasks,
            in_progress=in_progress_tasks,
            done=done_tasks,
            total=total_tasks
        ),
        teams=total_teams,
        users=total_users
    )
