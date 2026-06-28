import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Play, Star, Grid3X3, Clapperboard, TrendingUp, Sparkles, Film,
  Sword, Laugh, Ghost, Zap, Drama, Palette, Brain, Wand2, ChevronRight, ChevronLeft
} from 'lucide-react';
import { getTrendingMovies, getGenres, getMovies } from '../api/client';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';

const genreIcons = {
  Action: Sword,
  Comedy: Laugh,
  Horror: Ghost,
  'Sci-Fi': Zap,
  Drama: Drama,
  Animation: Palette,
  Thriller: Brain,
  Fantasy: Wand2,
};

const genreGradients = {
  Action: 'from-red-600/40 to-orange-600/20',
  Comedy: 'from-yellow-500/40 to-amber-600/20',
  Horror: 'from-gray-700/40 to-purple-900/20',
  'Sci-Fi': 'from-cyan-600/40 to-blue-700/20',
  Drama: 'from-pink-600/40 to-rose-700/20',
  Animation: 'from-green-500/40 to-teal-600/20',
  Thriller: 'from-indigo-600/40 to-slate-700/20',
  Fantasy: 'from-violet-600/40 to-purple-700/20',
};

function AnimatedCounter({ target, duration = 2000, label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !target) return;
    let start = 0;
    const end = parseInt(target, 10);
    if (isNaN(end)) return;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-heading text-4xl md:text-5xl font-black gradient-text mb-1">
        {count.toLocaleString()}
      </div>
      <div className="text-sm text-gray-400 font-medium">{label}</div>
    </div>
  );
}

function Section({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    setLoadingTrending(true);
    getTrendingMovies()
      .then((data) => setTrending(Array.isArray(data) ? data : data.movies || []))
      .catch(() => setTrending([]))
      .finally(() => setLoadingTrending(false));

    getGenres()
      .then((data) => setGenres(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setGenres([]));

    getMovies({ skip: 0, limit: 10 })
      .then((data) => setRecentMovies(Array.isArray(data) ? data : data.movies || data.results || []))
      .catch(() => setRecentMovies([]));
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  const displayGenres = genres.length > 0
    ? genres.map((g) => (typeof g === 'string' ? g : g.name))
    : ['Action', 'Comedy', 'Horror', 'Sci-Fi', 'Drama', 'Animation', 'Thriller', 'Fantasy'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ─── Hero Section ────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-navy-900 to-blue-900/30" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse animation-delay-400" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              The Ultimate Movie Ranking Experience
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-6"
          >
            <span className="text-white">Rank Your</span>
            <br />
            <span className="gradient-text text-shadow-glow">Favorite Films</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Create tier lists, explore studios, discover hidden gems, and get personalized
            movie recommendations — all in one stunning experience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/tiers" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              <Grid3X3 className="w-5 h-5" />
              Start Rating
            </Link>
            <Link to="/studios" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
              <Play className="w-5 h-5" />
              Explore Studios
            </Link>
          </motion.div>

          {/* Floating tier badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex justify-center gap-3 mt-12"
          >
            {[
              { t: 'S', c: 'bg-tier-s/20 border-tier-s/40 text-tier-s' },
              { t: 'A', c: 'bg-tier-a/20 border-tier-a/40 text-tier-a' },
              { t: 'B', c: 'bg-tier-b/20 border-tier-b/40 text-tier-b' },
              { t: 'C', c: 'bg-tier-c/20 border-tier-c/40 text-tier-c' },
              { t: 'D', c: 'bg-tier-d/20 border-tier-d/40 text-tier-d' },
            ].map(({ t, c }, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.1, type: 'spring' }}
                className={`w-12 h-12 rounded-xl border ${c} flex items-center justify-center font-heading font-black text-lg backdrop-blur-xl`}
              >
                {t}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Trending Now ────────────────────────────── */}
      <Section className="py-16 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
              <TrendingUp className="w-4 h-4" />
              Trending Now
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
              Top Rated Films
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => scroll(-1)} className="p-2 rounded-xl glass-card hover:bg-white/10 transition-all">
              <ChevronLeft className="w-5 h-5 text-gray-300" />
            </button>
            <button onClick={() => scroll(1)} className="p-2 rounded-xl glass-card hover:bg-white/10 transition-all">
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>

        {loadingTrending ? (
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 aspect-[2/3] rounded-2xl shimmer-skeleton" />
            ))}
          </div>
        ) : trending.length > 0 ? (
          <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scrollbar-thin">
            {trending.map((movie, i) => (
              <div key={movie.id || i} className="flex-shrink-0 w-48 snap-start">
                <MovieCard movie={movie} index={i} onSelect={setSelectedMovie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-card">
            <Film className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No trending movies found. Check your API connection.</p>
          </div>
        )}
      </Section>

      {/* ─── Browse by Genre ─────────────────────────── */}
      <Section className="py-16 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" />
            Explore
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
            Browse by Genre
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {displayGenres.map((genre, i) => {
            const GenreIcon = genreIcons[genre] || Film;
            const gradient = genreGradients[genre] || 'from-purple-600/40 to-blue-700/20';
            return (
              <motion.div
                key={genre}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={`/tiers?genre=${genre}`}
                  className={`group block p-6 rounded-2xl bg-gradient-to-br ${gradient} border border-white/5 hover:border-white/20 transition-all duration-500 hover:scale-[1.03] hover:shadow-xl`}
                >
                  <GenreIcon className="w-8 h-8 text-white/80 mb-3 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="font-heading font-bold text-white text-lg">{genre}</h3>
                  <p className="text-xs text-gray-400 mt-1">Explore →</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ─── Recently Added ──────────────────────────── */}
      {recentMovies.length > 0 && (
        <Section className="py-16 px-4 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
              <Star className="w-4 h-4" />
              Fresh Picks
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
              Recently Added
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {recentMovies.slice(0, 10).map((movie, i) => (
              <MovieCard key={movie.id || i} movie={movie} index={i} onSelect={setSelectedMovie} />
            ))}
          </div>
        </Section>
      )}

      {/* ─── Stats ───────────────────────────────────── */}
      <Section className="py-20 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto glass-card p-10 md:p-14">
          <div className="grid grid-cols-3 gap-8">
            <AnimatedCounter target={trending.length || 250} label="Movies" />
            <AnimatedCounter target={trending.length ? Math.floor(trending.length * 0.8) : 180} label="Ratings" />
            <AnimatedCounter target={12} label="Studios" />
          </div>
        </div>
      </Section>

      {/* ─── CTA ─────────────────────────────────────── */}
      <Section className="py-20 px-4 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build Your{' '}
            <span className="gradient-text">Tier List</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join the community and start ranking the greatest films ever made.
          </p>
          <Link
            to="/tiers"
            className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-4"
          >
            <Grid3X3 className="w-5 h-5" />
            Get Started
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </Section>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
      )}
    </motion.div>
  );
}
