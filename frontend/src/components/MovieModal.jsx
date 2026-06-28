import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, Clock, Calendar, Users, Film, Award, DollarSign, ImageOff, Plus, ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { getSimilarMovies } from '../api/client';

const tierColors = {
  S: { bg: 'bg-tier-s/20', border: 'border-tier-s/40', text: 'text-tier-s' },
  A: { bg: 'bg-tier-a/20', border: 'border-tier-a/40', text: 'text-tier-a' },
  B: { bg: 'bg-tier-b/20', border: 'border-tier-b/40', text: 'text-tier-b' },
  C: { bg: 'bg-tier-c/20', border: 'border-tier-c/40', text: 'text-tier-c' },
  D: { bg: 'bg-tier-d/20', border: 'border-tier-d/40', text: 'text-tier-d' },
};

function getRatingTier(rating) {
  if (!rating) return null;
  const r = parseFloat(rating);
  if (r >= 8.5) return 'S';
  if (r >= 7.5) return 'A';
  if (r >= 6.5) return 'B';
  if (r >= 5.0) return 'C';
  return 'D';
}

export default function MovieModal({ movie, onClose, onAddToTier }) {
  const [similar, setSimilar] = useState([]);
  const [showTierDropdown, setShowTierDropdown] = useState(false);

  // Load similar movies
  useEffect(() => {
    if (movie?.id) {
      getSimilarMovies(movie.id)
        .then((data) => setSimilar(Array.isArray(data) ? data.slice(0, 8) : []))
        .catch(() => setSimilar([]));
    }
  }, [movie?.id]);

  // ESC key handler
  const handleEsc = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [handleEsc]);

  if (!movie) return null;

  const rating = movie.imdb_rating || movie.rating;
  const tier = getRatingTier(rating);
  const tierStyle = tier ? tierColors[tier] : null;
  const genres = movie.genre
    ? typeof movie.genre === 'string'
      ? movie.genre.split(',').map((g) => g.trim())
      : movie.genre
    : [];
  const actors = movie.actors
    ? typeof movie.actors === 'string'
      ? movie.actors.split(',').map((a) => a.trim())
      : movie.actors
    : [];
  const rawPoster = movie.poster || movie.poster_url;
  const posterUrl = rawPoster && rawPoster !== 'N/A' ? rawPoster : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-navy-800/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 backdrop-blur-xl"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
            {/* Left: Poster */}
            <div className="flex-shrink-0 w-full md:w-72">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
                    <ImageOff className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 space-y-2">
                <div className="relative">
                  <button
                    onClick={() => setShowTierDropdown(!showTierDropdown)}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add to Tier
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showTierDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-navy-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 flex justify-center gap-2 z-50">
                      {['S', 'A', 'B', 'C', 'D'].map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            onAddToTier && onAddToTier(movie, t);
                            setShowTierDropdown(false);
                          }}
                          className={`tier-badge w-12 h-12 text-lg ${tierColors[t].bg} ${tierColors[t].border} border ${tierColors[t].text} hover:scale-110 transition-transform`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="flex-1 space-y-5">
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">
                  {movie.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Rating */}
                  {rating && tierStyle && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${tierStyle.bg} ${tierStyle.border} border`}>
                      <Star className={`w-4 h-4 ${tierStyle.text} fill-current`} />
                      <span className={`text-sm font-bold ${tierStyle.text}`}>{rating}</span>
                    </div>
                  )}

                  {/* Year */}
                  {movie.year && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      {movie.year}
                    </div>
                  )}

                  {/* Runtime */}
                  {movie.runtime && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {movie.runtime}
                    </div>
                  )}
                </div>
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Plot */}
              {movie.plot && (
                <div>
                  <h3 className="font-heading text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Plot</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{movie.plot}</p>
                </div>
              )}

              {/* Director */}
              {movie.director && (
                <div className="flex items-center gap-3">
                  <Film className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500 block">Director</span>
                    <span className="text-sm text-white font-medium">{movie.director}</span>
                  </div>
                </div>
              )}

              {/* Actors */}
              {actors.length > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500 block">Cast</span>
                    <span className="text-sm text-white">{actors.join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Awards & Box Office */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {movie.awards && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <Award className="w-4 h-4 text-tier-s flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 block">Awards</span>
                      <span className="text-xs text-white">{movie.awards}</span>
                    </div>
                  </div>
                )}
                {movie.box_office && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <DollarSign className="w-4 h-4 text-tier-a flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-gray-500 block">Box Office</span>
                      <span className="text-xs text-white">{movie.box_office}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Similar Movies */}
              {similar.length > 0 && (
                <div>
                  <h3 className="font-heading text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                    Similar Movies
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {similar.map((sm) => (
                      <div
                        key={sm.id}
                        className="flex-shrink-0 w-20 group cursor-pointer"
                      >
                        <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 mb-1.5 transition-transform duration-300 group-hover:scale-105">
                          {(sm.poster || sm.poster_url) && (sm.poster || sm.poster_url) !== 'N/A' ? (
                            <img src={sm.poster || sm.poster_url} alt={sm.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-navy-700 flex items-center justify-center">
                              <ImageOff className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-300 truncate">{sm.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
