from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from uuid import UUID
from typing import Optional, Any


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Optional[str] = Field(default="member", pattern="^(admin|manager|member)$")


class UserOut(BaseModel):
    """Schema for user output (without password)."""
    id: UUID
    username: str
    email: str
    role: str
    created_at: datetime
    
    @field_validator('role', mode='before')
    @classmethod
    def convert_enum_to_str(cls, v: Any) -> str:
        """Convert UserRole enum to string."""
        if hasattr(v, 'value'):
            return v.value
        return str(v)
    
    class Config:
        from_attributes = True


