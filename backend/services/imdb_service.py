from typing import Optional, List, Dict, Any

import httpx
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.movie import Movie

OMDB_BASE_URL = "http://www.omdbapi.com/"


async def search_movies(query: str, db: Session) -> List[Dict[str, Any]]:
    """
    Search OMDb API for movies matching the query.
    Results are cached in the local Movie table.
    Returns empty list if no API key is configured.
    """
    if not settings.OMDB_API_KEY:
        # Fallback: search local database
        local_results = (
            db.query(Movie)
            .filter(Movie.title.ilike(f"%{query}%"))
            .limit(10)
            .all()
        )
        return [_movie_to_dict(m) for m in local_results]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                OMDB_BASE_URL,
                params={"apikey": settings.OMDB_API_KEY, "s": query, "type": "movie"},
            )
            data = response.json()

        if data.get("Response") == "False":
            return []

        results = []
        for item in data.get("Search", []):
            # Check if already cached
            existing = db.query(Movie).filter(Movie.imdb_id == item.get("imdbID")).first()
            if existing:
                results.append(_movie_to_dict(existing))
            else:
                results.append({
                    "imdb_id": item.get("imdbID", ""),
                    "title": item.get("Title", ""),
                    "year": _parse_year(item.get("Year", "0")),
                    "poster_url": item.get("Poster", ""),
                    "genre": "",
                    "plot": "",
                    "imdb_rating": 0.0,
                    "runtime": "",
                    "director": "",
                    "actors": "",
                    "studio": "",
                })
        return results
    except Exception:
        # On any network error, fall back to local search
        local_results = (
            db.query(Movie)
            .filter(Movie.title.ilike(f"%{query}%"))
            .limit(10)
            .all()
        )
        return [_movie_to_dict(m) for m in local_results]


async def get_movie_by_imdb_id(imdb_id: str, db: Session) -> Optional[Dict[str, Any]]:
    """
    Fetch full movie details from OMDb by IMDb ID.
    Caches the result in the Movie table.
    """
    # Check cache first
    existing = db.query(Movie).filter(Movie.imdb_id == imdb_id).first()
    if existing:
        return _movie_to_dict(existing)

    if not settings.OMDB_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                OMDB_BASE_URL,
                params={"apikey": settings.OMDB_API_KEY, "i": imdb_id, "plot": "full"},
            )
            data = response.json()

        if data.get("Response") == "False":
            return None

        movie = _omdb_response_to_movie(data)
        db.add(movie)
        db.commit()
        db.refresh(movie)
        return _movie_to_dict(movie)
    except Exception:
        return None


async def get_movie_by_title(title: str, year: Optional[int] = None, db: Session = None) -> Optional[Dict[str, Any]]:
    """
    Fetch full movie details from OMDb by title (and optional year).
    Caches the result in the Movie table.
    """
    if db is not None:
        # Check local cache first by title (and year if given)
        query = db.query(Movie).filter(Movie.title.ilike(title))
        if year:
            query = query.filter(Movie.year == year)
        existing = query.first()
        if existing:
            return _movie_to_dict(existing)

    if not settings.OMDB_API_KEY:
        return None

    try:
        params: Dict[str, Any] = {
            "apikey": settings.OMDB_API_KEY,
            "t": title,
            "plot": "full",
        }
        if year:
            params["y"] = str(year)

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(OMDB_BASE_URL, params=params)
            data = response.json()

        if data.get("Response") == "False":
            return None

        movie = _omdb_response_to_movie(data)

        if db is not None:
            # Check again by imdb_id to avoid duplicates
            dup = db.query(Movie).filter(Movie.imdb_id == movie.imdb_id).first()
            if dup:
                return _movie_to_dict(dup)
            db.add(movie)
            db.commit()
            db.refresh(movie)

        return _movie_to_dict(movie)
    except Exception:
        return None


def _parse_year(year_str: str) -> int:
    """Parse year from OMDb response, handling ranges like '2019–2023'."""
    try:
        return int(year_str[:4])
    except (ValueError, IndexError):
        return 0


def _parse_float(value: str) -> float:
    """Parse a float from OMDb response, returning 0.0 on failure."""
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def _omdb_response_to_movie(data: Dict[str, Any]) -> Movie:
    """Convert an OMDb API response dict into a Movie ORM instance."""
    return Movie(
        imdb_id=data.get("imdbID", ""),
        title=data.get("Title", ""),
        year=_parse_year(data.get("Year", "0")),
        genre=data.get("Genre", ""),
        plot=data.get("Plot", ""),
        poster_url=data.get("Poster", ""),
        imdb_rating=_parse_float(data.get("imdbRating", "0")),
        runtime=data.get("Runtime", ""),
        director=data.get("Director", ""),
        actors=data.get("Actors", ""),
        studio=data.get("Production", "N/A"),
        awards=data.get("Awards", ""),
        box_office=data.get("BoxOffice", ""),
        metascore=data.get("Metascore", ""),
        rated=data.get("Rated", ""),
        released=data.get("Released", ""),
        language=data.get("Language", ""),
        country=data.get("Country", ""),
    )


def _movie_to_dict(movie: Movie) -> Dict[str, Any]:
    """Convert a Movie ORM instance to a plain dict."""
    return {
        "id": movie.id,
        "imdb_id": movie.imdb_id,
        "title": movie.title,
        "year": movie.year,
        "genre": movie.genre,
        "plot": movie.plot,
        "poster_url": movie.poster_url,
        "imdb_rating": movie.imdb_rating,
        "runtime": movie.runtime,
        "director": movie.director,
        "actors": movie.actors,
        "studio": movie.studio,
        "awards": movie.awards,
        "box_office": movie.box_office,
        "franchise": movie.franchise,
        "franchise_order": movie.franchise_order,
        "metascore": movie.metascore,
        "rated": movie.rated,
        "released": movie.released,
        "language": movie.language,
        "country": movie.country,
    }
