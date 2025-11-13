from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional


class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class TeamOut(TeamBase):
    id: UUID
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True
