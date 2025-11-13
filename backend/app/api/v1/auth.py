from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Annotated
import jwt

from app.core.database import get_db
from app.core.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_token
)

from app.schemas.user import UserCreate, UserOut
from app.schemas.auth import LoginRequest, LoginResponse
from app.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Register a new user.
    
    - **username**: Unique username (3-50 characters)
    - **email**: Unique email address
    - **password**: Password (minimum 8 characters)
    - **role**: User role (admin, manager, member) - defaults to member
    """
    # Check if user with email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user with hashed password
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        role=UserRole(user_data.role)  # Convert string to enum
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Login with email and password to receive an access token.
    
    Auto-creates user if they don't exist (allows any random user to login).
    
    - **email**: User's email address
    - **password**: User's password (will be set on first login)
    - **secret_code**: Optional secret code for manager role assignment
    
    Role assignment logic:
    - If email is "admin@example.com" → role is "admin"
    - Else if secret_code is "manager" → role is "manager"
    - Otherwise → role is "member" (normal user)
    
    Returns an access token to be used in Authorization header.
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == login_data.email).first()
        
        # If user doesn't exist, create them automatically
        if not user:
            # Extract username from email (part before @)
            username = login_data.email.split('@')[0]
            
            # Check if username already exists
            username_exists = db.query(User).filter(User.username == username).first()
            if username_exists:
                # Add a random suffix to make it unique
                import random
                username = f"{username}_{random.randint(1000, 9999)}"
            
            # Determine initial role
            if login_data.email == "admin@example.com":
                initial_role = UserRole.admin
            elif login_data.secret_code == "manager":
                initial_role = UserRole.manager
            else:
                initial_role = UserRole.member
            
            # Create new user
            user = User(
                username=username,
                email=login_data.email,
                password_hash=get_password_hash(login_data.password),
                role=initial_role
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            assigned_role = initial_role
        else:
            # Existing user - verify password
            if not verify_password(login_data.password, user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Dynamic role assignment based on login credentials
            assigned_role = user.role  # Default to user's current role
            
            # Check if admin
            if login_data.email == "admin@example.com":
                assigned_role = UserRole.admin
                # Update user role in database if not already admin
                if user.role != UserRole.admin:
                    user.role = UserRole.admin
                    db.commit()
            # Check if manager secret code provided
            elif login_data.secret_code == "manager":
                assigned_role = UserRole.manager
                # Update user role in database if not already manager
                if user.role != UserRole.manager:
                    user.role = UserRole.manager
                    db.commit()
            # Otherwise, ensure user is a member (normal user)
            else:
                # If no secret code and not admin, ensure role is member
                if user.role != UserRole.member and login_data.email != "admin@example.com":
                    assigned_role = UserRole.member
                    user.role = UserRole.member
                    db.commit()
        
        # Create access token with assigned role
        access_token = create_access_token(
            payload={
                "sub": str(user.id),
                "email": user.email,
                "role": assigned_role.value  # Use assigned role in token
            }
        )
        
        return LoginResponse(access_token=access_token)
    
    except HTTPException:
        raise
    except Exception as e:
        # Log the actual error for debugging
        print(f"Login error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)]
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Expects Authorization header with format: Bearer <token>
    """
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Load user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get current authenticated user's information.
    
    Requires Authorization header: Bearer <access_token>
    """
    return current_user
