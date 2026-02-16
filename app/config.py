from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./bots_site.db"
    secret_key: str = "dev-secret-change-in-production"
    admin_username: str = "admin"
    admin_password: str = "change_me"
    lead_rate_limit_per_day: int = 10
    login_attempts_limit: int = 5
    login_attempts_window_minutes: int = 15

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
