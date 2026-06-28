from typing import Optional
from pydantic import BaseModel


class MovieBase(BaseModel):
    title: str
    year: int
    genre: str
    plot: Optional[str] = None
    poster_url: Optional[str] = None
    imdb_rating: Optional[float] = None
    runtime: Optional[str] = None
    director: Optional[str] = None
    actors: Optional[str] = None
    studio: Optional[str] = None


class MovieCreate(MovieBase):
    imdb_id: Optional[str] = None
    awards: Optional[str] = None
    box_office: Optional[str] = None
    franchise: Optional[str] = None
    franchise_order: Optional[int] = None
    metascore: Optional[str] = None
    rated: Optional[str] = None
    released: Optional[str] = None
    language: Optional[str] = None
    country: Optional[str] = None


class MovieResponse(MovieBase):
    id: int
    imdb_id: Optional[str] = None
    awards: Optional[str] = None
    box_office: Optional[str] = None
    franchise: Optional[str] = None
    franchise_order: Optional[int] = None
    metascore: Optional[str] = None
    rated: Optional[str] = None
    released: Optional[str] = None
    language: Optional[str] = None
    country: Optional[str] = None

    model_config = {"from_attributes": True}


class MovieSearch(BaseModel):
    query: str
    genre: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    studio: Optional[str] = None
