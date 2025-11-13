import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.v1.auth import router as auth_router
from app.api.v1.teams import router as teams_router
from app.api.v1.projects import router as projects_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.comments import router as comments_router
from app.api.v1.stats import router as stats_router

# Load environment variables
load_dotenv()

app = FastAPI(title="Project Manager API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(teams_router, prefix="/api/v1/teams", tags=["teams"])
app.include_router(projects_router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(tasks_router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(comments_router, prefix="/api/v1/comments", tags=["comments"])
app.include_router(stats_router, prefix="/api/v1/stats", tags=["stats"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
