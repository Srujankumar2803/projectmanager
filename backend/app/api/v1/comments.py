from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentOut

router = APIRouter(tags=["comments"])


@router.get("/{task_id}", response_model=List[CommentOut])
def get_task_comments(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all comments for a specific task.
    Users must be authenticated to view comments.
    """
    # Verify task exists
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Get all comments for this task, ordered by creation date
    comments = db.query(Comment).filter(
        Comment.task_id == task_id
    ).order_by(Comment.created_at.asc()).all()
    
    # Add author names to comments
    result = []
    for comment in comments:
        comment_dict = {
            "id": comment.id,
            "task_id": comment.task_id,
            "author_id": comment.author_id,
            "message": comment.message,
            "created_at": comment.created_at,
            "author_name": comment.author.username if comment.author else "Unknown"
        }
        result.append(comment_dict)
    
    return result


@router.post("/", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new comment on a task.
    Users must be authenticated to create comments.
    """
    # Verify task exists
    task = db.query(Task).filter(Task.id == comment_data.task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Create new comment
    new_comment = Comment(
        task_id=comment_data.task_id,
        author_id=current_user.id,
        message=comment_data.message
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Return comment with author name
    return {
        "id": new_comment.id,
        "task_id": new_comment.task_id,
        "author_id": new_comment.author_id,
        "message": new_comment.message,
        "created_at": new_comment.created_at,
        "author_name": current_user.username
    }
