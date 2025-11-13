from pydantic import BaseModel


class ProjectStats(BaseModel):
    active: int
    completed: int
    total: int


class TaskStats(BaseModel):
    todo: int
    in_progress: int
    done: int
    total: int


class StatsOverview(BaseModel):
    projects: ProjectStats
    tasks: TaskStats
    teams: int
    users: int

    class Config:
        from_attributes = True
