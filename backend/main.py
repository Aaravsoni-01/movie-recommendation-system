from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base, SessionLocal
from backend.routers import auth, movies, tiers, studios, recommendations, analytics
from backend.scripts.seed_data import seed_database
import contextlib

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Seed data if db is empty
    db = SessionLocal()
    try:
        from backend.models.movie import Movie
        if not db.query(Movie).first():
            print("Seeding database...")
            seed_database(db)
    finally:
        db.close()
    yield
    pass

app = FastAPI(title="Movie Recommendation System API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(movies.router, prefix="/movies", tags=["Movies"])
app.include_router(tiers.router, prefix="/tiers", tags=["Tiers"])
app.include_router(studios.router, prefix="/studios", tags=["Studios"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Movie Recommendation System API is running"}
