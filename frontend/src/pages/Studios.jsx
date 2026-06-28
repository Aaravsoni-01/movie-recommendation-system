import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Search, Star, Film, TrendingUp, Loader2 } from 'lucide-react';
import { getStudios } from '../api/client';

export default function Studios() {
  const [studios, setStudios] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStudios()
      .then((data) => {
        const studioList = Array.isArray(data) ? data : data.studios || [];
        setStudios(studioList);
        setFiltered(studioList);
      })
      .catch(() => {
        setStudios([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(studios);
    } else {
      const q = search.toLowerCase();
      setFiltered(studios.filter((s) => (s.name || '').toLowerCase().includes(q)));
    }
  }, [search, studios]);

  const studioGradients = [
    'from-purple-600/30 to-blue-600/10',
    'from-blue-600/30 to-cyan-600/10',
    'from-emerald-600/30 to-teal-600/10',
    'from-amber-600/30 to-orange-600/10',
    'from-rose-600/30 to-pink-600/10',
    'from-indigo-600/30 to-violet-600/10',
    'from-cyan-600/30 to-sky-600/10',
    'from-orange-600/30 to-red-600/10',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-white flex items-center gap-3 mb-2">
          <Clapperboard className="w-8 h-8 text-purple-400" />
          Studios
        </h1>
        <p className="text-gray-400">Explore movie studios and their filmographies</p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search studios..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all text-sm"
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl shimmer-skeleton" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((studio, i) => (
            <motion.div
              key={studio.name || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={`/studios/${encodeURIComponent(studio.name)}`}
                className={`group block p-6 rounded-2xl bg-gradient-to-br ${studioGradients[i % studioGradients.length]} border border-white/5 hover:border-white/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10 transition-transform duration-300 group-hover:scale-110">
                    <Clapperboard className="w-7 h-7 text-white/80" />
                  </div>
                  <div className="flex items-center gap-1 text-tier-s">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold">
                      {studio.avg_rating ? parseFloat(studio.avg_rating).toFixed(1) : '—'}
                    </span>
                  </div>
                </div>

                <h3 className="font-heading text-xl font-bold text-white mb-2 group-hover:gradient-text transition-all duration-300">
                  {studio.name}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Film className="w-4 h-4" />
                    <span>{studio.movie_count || studio.total_movies || '—'} movies</span>
                  </div>
                  {studio.founded_year && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>Est. {studio.founded_year}</span>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-card">
          <Clapperboard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-heading font-bold text-gray-400 mb-2">No Studios Found</h3>
          <p className="text-gray-500">
            {search ? 'Try a different search term' : 'No studio data available yet'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
