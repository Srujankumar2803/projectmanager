from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr
    password: str
    secret_code: Optional[str] = None


class LoginResponse(BaseModel):
    """Schema for login response."""
    access_token: str
    token_type: str = "bearer"
