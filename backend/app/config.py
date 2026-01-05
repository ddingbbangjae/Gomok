import os
from pydantic import BaseModel, Field


class Settings(BaseModel):
    database_url: str = Field(default=os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app.db"))
    app_env: str = Field(default=os.getenv("APP_ENV", "development"))
    frontend_dist: str = Field(default=os.getenv("FRONTEND_DIST", "../frontend/dist"))


settings = Settings()
