from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class CommentCreate(BaseModel):
    task_id: UUID
    message: str


class CommentOut(BaseModel):
    id: UUID
    task_id: UUID
    author_id: UUID
    message: str
    created_at: datetime
    author_name: str | None = None  # We'll populate this from the User relationship

    class Config:
        from_attributes = True
