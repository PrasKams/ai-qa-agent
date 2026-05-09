import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    environment: str = "development"
    log_level: str = "INFO"
    rate_limit_requests: int = 100
    rate_limit_window: int = 3600
    
    class Config:
        env_file = ".env"

settings = Settings()