import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OMDB_API_KEY: str = ""
    SECRET_KEY: str = secrets.token_hex(32)
    DATABASE_URL: str = "sqlite:///./movies.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
