from typing import List, Optional, Dict, Any
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models.movie import Movie, Studio
from backend.schemas.movie import MovieResponse
from backend.services.chronological import get_by_decade

router = APIRouter(prefix="/studios", tags=["Studios"])


@router.get("/")
def list_studios(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """List all studios with their movie counts."""
    studios = db.query(Studio).order_by(Studio.name).all()

    result = []
    for studio in studios:
        movie_count = (
            db.query(Movie)
            .filter(Movie.studio.ilike(f"%{studio.name}%"))
            .count()
        )
        result.append({
            "id": studio.id,
            "name": studio.name,
            "description": studio.description,
            "founded_year": studio.founded_year,
            "logo_url": studio.logo_url,
            "movie_count": movie_count,
        })
    return result


@router.get("/{studio_name}")
def get_studio_detail(studio_name: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get studio detail with statistics: avg rating, total movies, genre breakdown."""
    studio = db.query(Studio).filter(Studio.name.ilike(f"%{studio_name}%")).first()

    movies = (
        db.query(Movie)
        .filter(Movie.studio.ilike(f"%{studio_name}%"))
        .all()
    )

    if not movies and studio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found",
        )

    # Compute statistics
    total_movies = len(movies)
    ratings = [m.imdb_rating for m in movies if m.imdb_rating is not None]
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

    # Genre breakdown
    genre_counts: Counter = Counter()
    for movie in movies:
        for g in (movie.genre or "").split(","):
            g = g.strip()
            if g:
                genre_counts[g] += 1

    genre_breakdown = dict(genre_counts.most_common())

    # Year range
    years = [m.year for m in movies if m.year]
    year_range = f"{min(years)}-{max(years)}" if years else "N/A"

    studio_info = None
    if studio:
        studio_info = {
            "id": studio.id,
            "name": studio.name,
            "description": studio.description,
            "founded_year": studio.founded_year,
            "logo_url": studio.logo_url,
        }

    return {
        "studio": studio_info,
        "total_movies": total_movies,
        "avg_rating": avg_rating,
        "genre_breakdown": genre_breakdown,
        "year_range": year_range,
        "top_rated": [
            MovieResponse.model_validate(m).model_dump()
            for m in sorted(movies, key=lambda x: x.imdb_rating or 0, reverse=True)[:5]
        ],
    }


@router.get("/{studio_name}/movies", response_model=List[MovieResponse])
def get_studio_movies(
    studio_name: str,
    genre: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    sort_by: Optional[str] = Query("year", regex="^(year|rating|title)$"),
    db: Session = Depends(get_db),
):
    """Get movies by studio with optional filters."""
    query = db.query(Movie).filter(Movie.studio.ilike(f"%{studio_name}%"))

    if genre:
        query = query.filter(Movie.genre.ilike(f"%{genre}%"))
    if year_from:
        query = query.filter(Movie.year >= year_from)
    if year_to:
        query = query.filter(Movie.year <= year_to)

    if sort_by == "rating":
        query = query.order_by(Movie.imdb_rating.desc().nullslast())
    elif sort_by == "title":
        query = query.order_by(Movie.title.asc())
    else:
        query = query.order_by(Movie.year.asc())

    return query.all()


@router.get("/{studio_name}/timeline")
def get_studio_timeline(
    studio_name: str,
    db: Session = Depends(get_db),
) -> Dict[str, List[Dict[str, Any]]]:
    """Get movies grouped by decade for a timeline view."""
    movies = (
        db.query(Movie)
        .filter(Movie.studio.ilike(f"%{studio_name}%"))
        .order_by(Movie.year.asc())
        .all()
    )

    if not movies:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No movies found for this studio",
        )

    decades: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for movie in movies:
        if movie.year:
            decade = (movie.year // 10) * 10
            decade_label = f"{decade}s"
            decades[decade_label].append(
                MovieResponse.model_validate(movie).model_dump()
            )

    return dict(sorted(decades.items()))
