import asyncio
import httpx
from urllib.parse import quote
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.movie import Movie
from backend.config import settings

async def update_movie_posters():
    db: Session = SessionLocal()
    movies = db.query(Movie).all()
    print(f"Checking posters for {len(movies)} movies...")
    
    api_key = settings.OMDB_API_KEY
    if not api_key:
        print("No OMDB_API_KEY set in .env. Using fallback placehold.co URLs.")
    
    async with httpx.AsyncClient() as client:
        for movie in movies:
            updated = False
            # If we have an API key and IMDb ID, fetch from OMDb
            if api_key and movie.imdb_id:
                try:
                    url = f"http://www.omdbapi.com/?i={movie.imdb_id}&apikey={api_key}"
                    resp = await client.get(url, timeout=5.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        poster = data.get("Poster")
                        if poster and poster != "N/A" and poster.startswith("http"):
                            movie.poster_url = poster
                            updated = True
                except Exception as e:
                    print(f"Failed OMDb fetch for {movie.title}: {e}")
            
            # If still using via.placeholder.com or N/A or not updated, fix placeholder
            if not updated and ("via.placeholder.com" in movie.poster_url or movie.poster_url == "N/A" or not movie.poster_url):
                safe_title = quote(movie.title)
                movie.poster_url = f"https://placehold.co/300x450/1a1a2e/ffffff.png?text={safe_title}"
        
        db.commit()
    db.close()
    print("Finished updating movie posters!")

if __name__ == "__main__":
    asyncio.run(update_movie_posters())
