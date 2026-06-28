from sqlalchemy import Column, Integer, String, Float, Text
from backend.database import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    imdb_id = Column(String(20), unique=True, nullable=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    genre = Column(String(255), nullable=False, index=True)
    plot = Column(Text, nullable=True)
    poster_url = Column(String(500), nullable=True)
    imdb_rating = Column(Float, nullable=True)
    runtime = Column(String(20), nullable=True)
    director = Column(String(255), nullable=True, index=True)
    actors = Column(String(500), nullable=True)
    studio = Column(String(255), nullable=True, index=True)
    awards = Column(String(500), nullable=True)
    box_office = Column(String(50), nullable=True)
    franchise = Column(String(100), nullable=True, index=True)
    franchise_order = Column(Integer, nullable=True)
    metascore = Column(String(10), nullable=True)
    rated = Column(String(10), nullable=True)
    released = Column(String(50), nullable=True)
    language = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)

    def __repr__(self) -> str:
        return f"<Movie(id={self.id}, title='{self.title}', year={self.year})>"


class Studio(Base):
    __tablename__ = "studios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    founded_year = Column(Integer, nullable=True)
    logo_url = Column(String(500), nullable=True)

    def __repr__(self) -> str:
        return f"<Studio(id={self.id}, name='{self.name}')>"
