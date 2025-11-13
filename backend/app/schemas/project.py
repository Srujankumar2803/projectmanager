from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from uuid import UUID
from typing import Optional


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    team_id: UUID
    status: str = Field(default="active", pattern="^(active|completed)$")
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    team_id: Optional[UUID] = None
    status: Optional[str] = Field(None, pattern="^(active|completed)$")
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectOut(ProjectBase):
    id: UUID
    manager_id: UUID
    created_at: datetime
    
    @field_validator("status", mode="before")
    @classmethod
    def convert_enum_to_string(cls, v):
        if hasattr(v, "value"):
            return v.value
        return v

    class Config:
        from_attributes = True
