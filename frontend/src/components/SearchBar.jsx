import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import { searchMovies, getGenres } from '../api/client';

export default function SearchBar({ onResults, onSelect, placeholder = 'Search movies...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState([]);
  const [filters, setFilters] = useState({ genre: '', yearFrom: '', yearTo: '' });
  const debounceTimer = useRef(null);
  const containerRef = useRef(null);

  // Load genres
  useEffect(() => {
    getGenres()
      .then((data) => setGenres(Array.isArray(data) ? data : []))
      .catch(() => setGenres([]));
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = useCallback(
    async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setShowResults(false);
        if (onResults) onResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchMovies(searchQuery);
        const movieList = Array.isArray(data) ? data : data.results || data.movies || [];
        setResults(movieList);
        setShowResults(true);
        if (onResults) onResults(movieList);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [onResults]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => doSearch(value), 300);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    if (onResults) onResults([]);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search input */}
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none">
          {loading ? (
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-20 py-3.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all duration-300 text-sm font-medium"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-all ${
              showFilters
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-2xl glass-card">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Genre */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Genre</label>
                  <div className="relative">
                    <select
                      value={filters.genre}
                      onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    >
                      <option value="" className="bg-navy-800">All Genres</option>
                      {genres.map((g) => (
                        <option key={typeof g === 'string' ? g : g.name} value={typeof g === 'string' ? g : g.name} className="bg-navy-800">
                          {typeof g === 'string' ? g : g.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Year From */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Year From</label>
                  <input
                    type="number"
                    value={filters.yearFrom}
                    onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                    placeholder="1950"
                    min="1900"
                    max="2030"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>

                {/* Year To */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Year To</label>
                  <input
                    type="number"
                    value={filters.yearTo}
                    onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                    placeholder="2025"
                    min="1900"
                    max="2030"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results dropdown */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-2 bg-navy-800/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-80 overflow-y-auto"
          >
            {results.map((movie, i) => (
              <button
                key={movie.id || i}
                onClick={() => {
                  onSelect && onSelect(movie);
                  setShowResults(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-navy-700">
                  {(movie.poster || movie.poster_url) && (movie.poster || movie.poster_url) !== 'N/A' ? (
                    <img src={movie.poster || movie.poster_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">N/A</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{movie.title}</p>
                  <p className="text-xs text-gray-400">
                    {movie.year}
                    {movie.director && ` • ${movie.director}`}
                    {(movie.imdb_rating || movie.rating) && ` • ⭐ ${movie.imdb_rating || movie.rating}`}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
