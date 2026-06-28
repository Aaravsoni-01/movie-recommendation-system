from typing import List, Dict, Any
from collections import Counter, defaultdict

from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from backend.models.movie import Movie
from backend.models.tier import TierList, TierItem
from backend.schemas.movie import MovieResponse

# Tier numerical weights for scoring
TIER_WEIGHTS: Dict[str, float] = {
    "S": 5.0,
    "A": 4.0,
    "B": 3.0,
    "C": 2.0,
    "D": 1.0,
}

MOOD_GENRE_MAP: Dict[str, List[str]] = {
    "funny": ["Comedy", "Animation"],
    "scary": ["Horror", "Thriller"],
    "thrilling": ["Action", "Thriller", "Sci-Fi"],
    "epic": ["Adventure", "Fantasy", "Sci-Fi"],
    "heartwarming": ["Drama", "Romance", "Family"],
    "thoughtful": ["Drama", "Mystery", "Documentary"],
}


def _movie_to_response_dict(movie: Movie) -> Dict[str, Any]:
    """Convert a Movie ORM object to a dict compatible with MovieResponse."""
    return {
        "movie": MovieResponse.model_validate(movie).model_dump(),
        "reason": "",
        "score": 0.0,
    }


def get_content_based_recommendations(
    movie_id: int, db: Session, limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Content-based recommendations using TF-IDF on genre + plot text.
    Computes cosine similarity between the target movie and all other movies.
    """
    target_movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if target_movie is None:
        return []

    all_movies = db.query(Movie).all()
    if len(all_movies) < 2:
        return []

    # Build text corpus: combine genre and plot for each movie
    corpus: List[str] = []
    movie_list: List[Movie] = []
    target_idx = -1

    for i, m in enumerate(all_movies):
        text = f"{m.genre or ''} {m.plot or ''} {m.director or ''}"
        corpus.append(text)
        movie_list.append(m)
        if m.id == movie_id:
            target_idx = i

    if target_idx == -1:
        return []

    # Compute TF-IDF and cosine similarity
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(corpus)
    similarity_scores = cosine_similarity(tfidf_matrix[target_idx : target_idx + 1], tfidf_matrix).flatten()

    # Get indices sorted by similarity, skip self
    similar_indices = np.argsort(similarity_scores)[::-1]

    results: List[Dict[str, Any]] = []
    for idx in similar_indices:
        if int(idx) == target_idx:
            continue
        sim_score = float(similarity_scores[idx])
        if sim_score <= 0:
            continue
        m = movie_list[int(idx)]

        # Build descriptive reason
        shared_genres = _shared_genres(target_movie.genre or "", m.genre or "")
        if shared_genres:
            genre_str = ", ".join(shared_genres)
            reason = (
                f"Because you liked '{target_movie.title}', you might enjoy '{m.title}' — "
                f"they share {genre_str} themes"
            )
        else:
            reason = (
                f"'{m.title}' has a similar storyline and style to '{target_movie.title}'"
            )

        if m.director and target_movie.director and m.director == target_movie.director:
            reason += f", and both are directed by {m.director}"

        results.append({
            "movie": MovieResponse.model_validate(m).model_dump(),
            "reason": reason,
            "score": round(sim_score, 4),
        })
        if len(results) >= limit:
            break

    return results


def get_collaborative_recommendations(
    user_id: int, db: Session, limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Collaborative filtering: find users with similar tier patterns,
    recommend their highly-rated movies (S/A tier) that the current user hasn't seen.
    """
    # Get current user's tier items
    user_tier_lists = db.query(TierList).filter(TierList.user_id == user_id).all()
    user_list_ids = [tl.id for tl in user_tier_lists]

    if not user_list_ids:
        return []

    user_items = (
        db.query(TierItem)
        .filter(TierItem.tier_list_id.in_(user_list_ids))
        .all()
    )
    if not user_items:
        return []

    # Build current user's movie→score map
    user_movie_scores: Dict[int, float] = {}
    for item in user_items:
        user_movie_scores[item.movie_id] = TIER_WEIGHTS.get(item.tier, 3.0)

    user_movie_ids = set(user_movie_scores.keys())

    # Find all other users
    all_tier_lists = db.query(TierList).filter(TierList.user_id != user_id).all()
    other_users: Dict[int, List[TierItem]] = defaultdict(list)
    for tl in all_tier_lists:
        items = db.query(TierItem).filter(TierItem.tier_list_id == tl.id).all()
        other_users[tl.user_id].extend(items)

    if not other_users:
        # No other users; fall back to top-rated movies user hasn't seen
        return _fallback_recommendations(user_movie_ids, db, limit)

    # Compute similarity with each other user and collect candidate movies
    candidates: Dict[int, float] = {}  # movie_id → weighted score
    candidate_reasons: Dict[int, str] = {}

    for other_uid, other_items in other_users.items():
        other_scores: Dict[int, float] = {}
        for item in other_items:
            other_scores[item.movie_id] = TIER_WEIGHTS.get(item.tier, 3.0)

        # Compute overlap similarity (Pearson-like)
        common_movies = user_movie_ids & set(other_scores.keys())
        if len(common_movies) < 2:
            continue

        user_vec = [user_movie_scores[mid] for mid in common_movies]
        other_vec = [other_scores[mid] for mid in common_movies]

        # Simple correlation coefficient
        similarity = _pearson_correlation(user_vec, other_vec)
        if similarity <= 0:
            continue

        # Recommend their highly-rated movies the user hasn't seen
        for mid, score in other_scores.items():
            if mid not in user_movie_ids and score >= 4.0:  # A-tier or S-tier
                weighted = similarity * score
                if mid not in candidates or candidates[mid] < weighted:
                    candidates[mid] = weighted
                    tier_label = "S" if score >= 5.0 else "A"
                    candidate_reasons[mid] = (
                        f"Users with similar taste rated this {tier_label}-tier"
                    )

    if not candidates:
        return _fallback_recommendations(user_movie_ids, db, limit)

    # Sort by weighted score
    sorted_candidates = sorted(candidates.items(), key=lambda x: x[1], reverse=True)[:limit]

    results: List[Dict[str, Any]] = []
    for mid, score in sorted_candidates:
        movie = db.query(Movie).filter(Movie.id == mid).first()
        if movie:
            results.append({
                "movie": MovieResponse.model_validate(movie).model_dump(),
                "reason": candidate_reasons.get(mid, "Recommended based on similar users' preferences"),
                "score": round(score, 4),
            })

    return results


def get_mood_recommendations(
    mood: str, db: Session, limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Map moods to genre combinations and return matching highly-rated movies.
    """
    target_genres = MOOD_GENRE_MAP.get(mood, ["Drama"])

    all_movies = db.query(Movie).order_by(Movie.imdb_rating.desc().nullslast()).all()

    mood_labels = {
        "funny": "a laugh",
        "scary": "a scare",
        "thrilling": "an adrenaline rush",
        "epic": "an epic adventure",
        "heartwarming": "something heartwarming",
        "thoughtful": "something thought-provoking",
    }
    mood_label = mood_labels.get(mood, "this mood")

    results: List[Dict[str, Any]] = []
    for movie in all_movies:
        movie_genres = [g.strip() for g in (movie.genre or "").split(",")]
        matching_genres = [g for g in target_genres if g in movie_genres]
        if matching_genres:
            match_score = len(matching_genres) / len(target_genres)
            rating_bonus = (movie.imdb_rating or 5.0) / 10.0
            final_score = (match_score * 0.6) + (rating_bonus * 0.4)

            genre_str = ", ".join(matching_genres)
            reason = (
                f"Perfect for {mood_label} — '{movie.title}' is a great {genre_str} film "
                f"rated {movie.imdb_rating}/10"
            )

            results.append({
                "movie": MovieResponse.model_validate(movie).model_dump(),
                "reason": reason,
                "score": round(final_score, 4),
            })

        if len(results) >= limit * 3:
            break

    # Sort by score and return top
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]


def get_watch_next(
    user_id: int, db: Session, limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Analyze user's tier history, find underexplored genres,
    and suggest highly-rated movies from those genres.
    """
    # Get user's rated movies
    user_tier_lists = db.query(TierList).filter(TierList.user_id == user_id).all()
    user_list_ids = [tl.id for tl in user_tier_lists]

    if not user_list_ids:
        # No tiers at all — return top-rated movies
        top = db.query(Movie).order_by(Movie.imdb_rating.desc().nullslast()).limit(limit).all()
        return [
            {
                "movie": MovieResponse.model_validate(m).model_dump(),
                "reason": f"Highly acclaimed film with a {m.imdb_rating}/10 rating — a great starting point!",
                "score": round((m.imdb_rating or 5.0) / 10.0, 4),
            }
            for m in top
        ]

    user_items = (
        db.query(TierItem)
        .filter(TierItem.tier_list_id.in_(user_list_ids))
        .all()
    )
    rated_movie_ids = {item.movie_id for item in user_items}

    # Count genres the user has rated
    genre_counts: Counter = Counter()
    liked_genres: Counter = Counter()  # S/A-tier genres
    for item in user_items:
        movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
        if movie:
            for g in (movie.genre or "").split(","):
                g = g.strip()
                if g:
                    genre_counts[g] += 1
                    if item.tier in ("S", "A"):
                        liked_genres[g] += 1

    # Find all genres in database
    all_movies = db.query(Movie).all()
    all_genre_counts: Counter = Counter()
    for m in all_movies:
        for g in (m.genre or "").split(","):
            g = g.strip()
            if g:
                all_genre_counts[g] += 1

    # Identify underexplored genres: exist in DB but user has rated few/none
    explored_ratio = {
        g: genre_counts.get(g, 0) / count
        for g, count in all_genre_counts.items()
        if count >= 3
    }

    # Sort by least explored (and prefer genres the user has liked)
    underexplored = sorted(explored_ratio.items(), key=lambda x: x[1])

    results: List[Dict[str, Any]] = []
    seen_movie_ids: set = set()

    for genre, ratio in underexplored:
        if len(results) >= limit:
            break

        # Find highly rated unwatched movies in this genre
        candidates = (
            db.query(Movie)
            .filter(
                Movie.genre.ilike(f"%{genre}%"),
                Movie.id.notin_(rated_movie_ids),
            )
            .order_by(Movie.imdb_rating.desc().nullslast())
            .limit(3)
            .all()
        )

        for movie in candidates:
            if movie.id in seen_movie_ids:
                continue
            if len(results) >= limit:
                break

            seen_movie_ids.add(movie.id)
            liked_str = ""
            if liked_genres:
                top_liked = liked_genres.most_common(1)[0][0]
                liked_str = f" Since you love {top_liked} films,"
            reason = (
                f"Expand your horizons with some {genre}!{liked_str} "
                f"'{movie.title}' ({movie.year}) is rated {movie.imdb_rating}/10"
            )
            score = (movie.imdb_rating or 5.0) / 10.0
            results.append({
                "movie": MovieResponse.model_validate(movie).model_dump(),
                "reason": reason,
                "score": round(score, 4),
            })

    return results


def _shared_genres(genres_a: str, genres_b: str) -> List[str]:
    """Return the list of genres shared between two comma-separated genre strings."""
    set_a = {g.strip() for g in genres_a.split(",") if g.strip()}
    set_b = {g.strip() for g in genres_b.split(",") if g.strip()}
    return sorted(set_a & set_b)


def _pearson_correlation(x: List[float], y: List[float]) -> float:
    """Compute Pearson correlation between two lists of floats."""
    n = len(x)
    if n < 2:
        return 0.0
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    denom_x = sum((xi - mean_x) ** 2 for xi in x) ** 0.5
    denom_y = sum((yi - mean_y) ** 2 for yi in y) ** 0.5
    if denom_x == 0 or denom_y == 0:
        return 0.0
    return numerator / (denom_x * denom_y)


def _fallback_recommendations(
    exclude_ids: set, db: Session, limit: int
) -> List[Dict[str, Any]]:
    """Fallback: return top-rated movies the user hasn't seen."""
    query = db.query(Movie).order_by(Movie.imdb_rating.desc().nullslast())
    if exclude_ids:
        query = query.filter(Movie.id.notin_(exclude_ids))
    movies = query.limit(limit).all()
    return [
        {
            "movie": MovieResponse.model_validate(m).model_dump(),
            "reason": f"Top-rated film you haven't explored yet — {m.imdb_rating}/10 on IMDb",
            "score": round((m.imdb_rating or 5.0) / 10.0, 4),
        }
        for m in movies
    ]
