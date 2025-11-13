from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: UUID
    assigned_to: UUID
    status: str = "todo"
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[UUID] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None


class TaskOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    project_id: UUID
    assigned_to: UUID
    status: str
    due_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
