import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, ImageOff, X } from 'lucide-react';

const tierConfig = {
  S: {
    label: 'S',
    title: 'Masterpiece',
    color: '#FFD700',
    bg: 'from-yellow-500/20 to-amber-600/10',
    border: 'border-yellow-500/30',
    textColor: 'text-tier-s',
    headerBg: 'bg-gradient-to-r from-yellow-500/30 to-amber-500/10',
  },
  A: {
    label: 'A',
    title: 'Excellent',
    color: '#10B981',
    bg: 'from-emerald-500/20 to-green-600/10',
    border: 'border-emerald-500/30',
    textColor: 'text-tier-a',
    headerBg: 'bg-gradient-to-r from-emerald-500/30 to-green-500/10',
  },
  B: {
    label: 'B',
    title: 'Good',
    color: '#3B82F6',
    bg: 'from-blue-500/20 to-indigo-600/10',
    border: 'border-blue-500/30',
    textColor: 'text-tier-b',
    headerBg: 'bg-gradient-to-r from-blue-500/30 to-indigo-500/10',
  },
  C: {
    label: 'C',
    title: 'Average',
    color: '#F59E0B',
    bg: 'from-amber-500/20 to-orange-600/10',
    border: 'border-amber-500/30',
    textColor: 'text-tier-c',
    headerBg: 'bg-gradient-to-r from-amber-500/30 to-orange-500/10',
  },
  D: {
    label: 'D',
    title: 'Poor',
    color: '#EF4444',
    bg: 'from-red-500/20 to-rose-600/10',
    border: 'border-red-500/30',
    textColor: 'text-tier-d',
    headerBg: 'bg-gradient-to-r from-red-500/30 to-rose-500/10',
  },
};

function SortableMovieItem({ movie, tier, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: movie.dragId || `${tier}-${movie.id}`,
    data: { movie, tier },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const rawPoster = movie.poster || movie.poster_url;
  const posterUrl = rawPoster && rawPoster !== 'N/A' ? rawPoster : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group flex-shrink-0 w-24 h-36 md:w-28 md:h-40 rounded-xl overflow-hidden border border-white/10 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'shadow-2xl shadow-purple-500/30 ring-2 ring-purple-500/50' : 'hover:border-white/30 hover:scale-105'
      }`}
    >
      {posterUrl ? (
        <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
          <ImageOff className="w-6 h-6 text-gray-600" />
        </div>
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Title */}
      <div className="absolute bottom-0 left-0 right-0 p-1.5">
        <p className="text-[10px] font-medium text-white leading-tight truncate">{movie.title}</p>
        <p className="text-[9px] text-gray-400">{movie.year}</p>
      </div>

      {/* Drag handle indicator */}
      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3.5 h-3.5 text-white/60" />
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove(movie);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}

export default function TierRow({ tier, items = [], onRemoveItem }) {
  const config = tierConfig[tier];
  const { setNodeRef, isOver } = useDroppable({
    id: `tier-${tier}`,
    data: { tier },
  });

  const itemIds = items.map((m) => m.dragId || `${tier}-${m.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col sm:flex-row items-stretch rounded-2xl overflow-hidden border transition-all duration-300 ${
        config.border
      } ${isOver ? 'ring-2 ring-purple-500/50 bg-purple-500/5' : 'bg-white/[0.02]'}`}
    >
      {/* Tier Header */}
      <div
        className={`flex items-center justify-center sm:w-20 md:w-24 p-3 sm:p-4 ${config.headerBg}`}
        style={{ borderRight: `2px solid ${config.color}33` }}
      >
        <div className="text-center">
          <span
            className="font-heading text-3xl md:text-4xl font-black"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5 hidden sm:block">
            {config.title}
          </p>
        </div>
      </div>

      {/* Droppable area */}
      <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 flex items-center gap-2 p-3 min-h-[10rem] sm:min-h-[11rem] overflow-x-auto transition-colors duration-300 ${
            isOver ? 'bg-white/5' : ''
          }`}
        >
          {items.length > 0 ? (
            items.map((movie) => (
              <SortableMovieItem
                key={movie.dragId || `${tier}-${movie.id}`}
                movie={movie}
                tier={tier}
                onRemove={onRemoveItem}
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-600 italic">
                Drag movies here to rank them as {config.title}
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </motion.div>
  );
}
