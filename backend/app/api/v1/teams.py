from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate, TeamOut
from app.api.dependencies import get_current_user, require_admin

router = APIRouter()


@router.get("/", response_model=List[TeamOut])
async def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all teams. Accessible by all authenticated users (admin, manager, member).
    """
    teams = db.query(Team).all()
    return teams


@router.get("/{team_id}", response_model=TeamOut)
async def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific team by ID. Accessible by all authenticated users.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    return team


@router.post("/", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new team. Only accessible by admin users.
    """
    # Check if team name already exists
    existing_team = db.query(Team).filter(Team.name == team_data.name).first()
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team name already exists"
        )
    
    team = Team(
        name=team_data.name,
        description=team_data.description,
        created_by=current_user.id
    )
    
    db.add(team)
    db.commit()
    db.refresh(team)
    
    return team


@router.put("/{team_id}", response_model=TeamOut)
async def update_team(
    team_id: UUID,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update a team. Only accessible by admin users.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if new name conflicts with existing team
    if team_data.name and team_data.name != team.name:
        existing_team = db.query(Team).filter(Team.name == team_data.name).first()
        if existing_team:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists"
            )
        team.name = team_data.name
    
    if team_data.description is not None:
        team.description = team_data.description
    
    db.commit()
    db.refresh(team)
    
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete a team. Only accessible by admin users.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    db.delete(team)
    db.commit()
    
    return None
