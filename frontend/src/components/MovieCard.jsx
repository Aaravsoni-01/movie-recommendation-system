import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, ChevronDown, ImageOff } from 'lucide-react';

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

export default function MovieCard({ movie, onAddToTier, onSelect, index = 0, compact = false }) {
  const [imgError, setImgError] = useState(false);
  const [showTierDropdown, setShowTierDropdown] = useState(false);
  const tier = getRatingTier(movie.imdb_rating || movie.rating);
  const tierStyle = tier ? tierColors[tier] : null;

  const rawPoster = movie.poster || movie.poster_url;
  const posterUrl = rawPoster && rawPoster !== 'N/A' ? rawPoster : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-2xl glass-card transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/10 hover:border-white/20 cursor-pointer ${
        compact ? 'w-36' : 'w-full'
      }`}
      onClick={() => onSelect && onSelect(movie)}
    >
      {/* Poster */}
      <div className={`relative overflow-hidden ${compact ? 'aspect-[2/3]' : 'aspect-[2/3]'}`}>
        {posterUrl && !imgError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
            <ImageOff className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

        {/* Rating badge */}
        {tier && (
          <div className={`absolute top-3 right-3 ${tierStyle.bg} ${tierStyle.border} border backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1`}>
            <Star className={`w-3 h-3 ${tierStyle.text} fill-current`} />
            <span className={`text-xs font-bold ${tierStyle.text}`}>
              {movie.imdb_rating || movie.rating}
            </span>
          </div>
        )}

        {/* Hover overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          {!compact && (
            <>
              <h3 className="font-heading font-bold text-lg text-white leading-tight line-clamp-2 mb-1">
                {movie.title}
              </h3>
              <p className="text-sm text-gray-300 mb-2">
                {movie.year}{movie.director ? ` • ${movie.director}` : ''}
              </p>

              {/* Genre tags */}
              {movie.genre && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(typeof movie.genre === 'string' ? movie.genre.split(',').map(g => g.trim()) : movie.genre)
                    .slice(0, 3)
                    .map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-medium text-gray-300 border border-white/5"
                      >
                        {g}
                      </span>
                    ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTierDropdown(!showTierDropdown);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-600 hover:to-blue-600 text-white text-xs font-semibold transition-all duration-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to Tier
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Tier dropdown */}
                  {showTierDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 bg-navy-800/95 backdrop-blur-xl border border-white/10 rounded-xl p-1 flex gap-1 z-50 shadow-xl">
                      {['S', 'A', 'B', 'C', 'D'].map((t) => (
                        <button
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToTier && onAddToTier(movie, t);
                            setShowTierDropdown(false);
                          }}
                          className={`tier-badge ${tierColors[t].bg} ${tierColors[t].border} border ${tierColors[t].text} hover:scale-110 transition-transform`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom info for non-compact */}
      {!compact && (
        <div className="p-3 pt-2">
          <h3 className="font-heading font-semibold text-sm text-white truncate group-hover:opacity-0 transition-opacity duration-300">
            {movie.title}
          </h3>
          <p className="text-xs text-gray-500 group-hover:opacity-0 transition-opacity duration-300">
            {movie.year}
          </p>
        </div>
      )}

      {/* Compact title */}
      {compact && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
          <p className="text-xs font-medium text-white truncate">{movie.title}</p>
        </div>
      )}
    </motion.div>
  );
}
