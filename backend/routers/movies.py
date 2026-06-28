from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models.movie import Movie
from backend.models.user import User
from backend.schemas.movie import MovieResponse
from backend.services.auth_service import get_current_user
from backend.services import imdb_service

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get("/", response_model=List[MovieResponse])
def list_movies(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    genre: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    studio: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List movies with pagination and optional filters."""
    query = db.query(Movie)

    if genre:
        query = query.filter(Movie.genre.ilike(f"%{genre}%"))
    if year_from:
        query = query.filter(Movie.year >= year_from)
    if year_to:
        query = query.filter(Movie.year <= year_to)
    if studio:
        query = query.filter(Movie.studio.ilike(f"%{studio}%"))

    movies = query.order_by(Movie.title).offset(skip).limit(limit).all()
    return movies


@router.get("/search", response_model=List[MovieResponse])
def search_movies(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """Search movies by query string across title, director, and actors."""
    search_term = f"%{q}%"
    movies = (
        db.query(Movie)
        .filter(
            (Movie.title.ilike(search_term))
            | (Movie.director.ilike(search_term))
            | (Movie.actors.ilike(search_term))
        )
        .order_by(Movie.imdb_rating.desc().nullslast())
        .limit(50)
        .all()
    )
    return movies


@router.get("/trending", response_model=List[MovieResponse])
def trending_movies(db: Session = Depends(get_db)):
    """Get top 20 movies by IMDb rating."""
    movies = (
        db.query(Movie)
        .filter(Movie.imdb_rating.isnot(None))
        .order_by(Movie.imdb_rating.desc())
        .limit(20)
        .all()
    )
    return movies


@router.get("/genres", response_model=List[str])
def list_genres(db: Session = Depends(get_db)):
    """List all unique genres across the movie database."""
    movies = db.query(Movie.genre).distinct().all()
    genre_set: set = set()
    for (genre_str,) in movies:
        if genre_str:
            for g in genre_str.split(","):
                g = g.strip()
                if g:
                    genre_set.add(g)
    return sorted(genre_set)


@router.get("/{movie_id}", response_model=MovieResponse)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    """Get a single movie by its database ID."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if movie is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found",
        )
    return movie


@router.post("/fetch-omdb", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
async def fetch_from_omdb(
    title: str = Query(..., min_length=1),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a movie from OMDb API by title and add it to the database. Protected endpoint."""
    result = await imdb_service.get_movie_by_title(title, year=year, db=db)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found on OMDb. Check the title or ensure OMDB_API_KEY is set.",
        )

    # Retrieve the newly added movie from DB
    movie = (
        db.query(Movie)
        .filter(Movie.title.ilike(f"%{title}%"))
        .order_by(Movie.id.desc())
        .first()
    )
    if movie is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save movie to database",
        )
    return movie
