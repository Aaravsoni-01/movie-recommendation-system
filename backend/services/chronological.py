from typing import List, Dict, Any
from collections import defaultdict

from sqlalchemy.orm import Session

from backend.models.movie import Movie
from backend.schemas.movie import MovieResponse


def get_by_release_date(movies: List[Movie], ascending: bool = True) -> List[Dict[str, Any]]:
    """Sort a list of Movie objects by year."""
    sorted_movies = sorted(movies, key=lambda m: m.year or 0, reverse=not ascending)
    return [
        MovieResponse.model_validate(m).model_dump()
        for m in sorted_movies
    ]


def get_franchise_order(franchise_name: str, db: Session) -> List[Dict[str, Any]]:
    """Return movies in a given franchise, sorted by franchise_order (then year)."""
    movies = (
        db.query(Movie)
        .filter(Movie.franchise.ilike(f"%{franchise_name}%"))
        .all()
    )
    # Sort by franchise_order first (nulls last), then by year
    sorted_movies = sorted(
        movies,
        key=lambda m: (
            m.franchise_order if m.franchise_order is not None else 9999,
            m.year or 0,
        ),
    )
    return [
        MovieResponse.model_validate(m).model_dump()
        for m in sorted_movies
    ]


def get_director_filmography(director_name: str, db: Session) -> List[Dict[str, Any]]:
    """Return all films by a director, sorted by year ascending."""
    movies = (
        db.query(Movie)
        .filter(Movie.director.ilike(f"%{director_name}%"))
        .order_by(Movie.year.asc())
        .all()
    )
    return [
        MovieResponse.model_validate(m).model_dump()
        for m in movies
    ]


def get_by_decade(db: Session) -> Dict[str, List[Dict[str, Any]]]:
    """Group all movies into decade buckets (1950s, 1960s, ..., 2020s)."""
    all_movies = db.query(Movie).order_by(Movie.year.asc()).all()

    decades: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for movie in all_movies:
        if movie.year:
            decade = (movie.year // 10) * 10
            decade_label = f"{decade}s"
            decades[decade_label].append(
                MovieResponse.model_validate(movie).model_dump()
            )

    # Return ordered by decade
    return dict(sorted(decades.items()))
