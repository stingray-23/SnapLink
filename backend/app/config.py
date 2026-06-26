from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    geo_api_url: str = "http://ip-api.com/json"

    class Config:
        env_file = ".env"

settings = Settings()
