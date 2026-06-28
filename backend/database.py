from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator

from backend.config import settings

# Handle SQLite-specific connect args
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create all database tables from model metadata."""
    Base.metadata.create_all(bind=engine)
