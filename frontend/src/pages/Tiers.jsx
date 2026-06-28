import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  Grid3X3, Save, Plus, Loader2, ImageOff, AlertCircle, GripVertical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TierRow from '../components/TierRow';
import SearchBar from '../components/SearchBar';
import MovieModal from '../components/MovieModal';
import {
  getTierLists, createTierList, getTierList, addTierItem, updateTierItem, removeTierItem,
  searchMovies, getTrendingMovies,
} from '../api/client';

const TIERS = ['S', 'A', 'B', 'C', 'D'];

export default function Tiers() {
  const { user } = useAuth();
  const [tierLists, setTierLists] = useState([]);
  const [activeTierList, setActiveTierList] = useState(null);
  const [tierItems, setTierItems] = useState({ S: [], A: [], B: [], C: [], D: [] });
  const [unranked, setUnranked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Load tier lists
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (user) {
          const lists = await getTierLists();
          const listArray = Array.isArray(lists) ? lists : [];
          setTierLists(listArray);

          if (listArray.length > 0) {
            const firstList = await getTierList(listArray[0].id);
            setActiveTierList(firstList);
            organizeTierItems(firstList.items || []);
          }
        }

        // Load initial unranked movies
        const trending = await getTrendingMovies();
        const movies = Array.isArray(trending) ? trending : trending.movies || [];
        setUnranked(movies.slice(0, 20));
      } catch (err) {
        console.error('Failed to load tier data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const organizeTierItems = (items) => {
    const organized = { S: [], A: [], B: [], C: [], D: [] };
    (items || []).forEach((item) => {
      const tier = item.tier || 'C';
      if (organized[tier]) {
        const movie = item.movie || item;
        organized[tier].push({
          ...movie,
          itemId: item.id,
          dragId: `${tier}-${item.id || movie.id}`,
        });
      }
    });
    setTierItems(organized);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const newList = await createTierList(newListName.trim());
      setTierLists((prev) => [...prev, newList]);
      setActiveTierList(newList);
      setTierItems({ S: [], A: [], B: [], C: [], D: [] });
      setNewListName('');
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create tier list');
    }
  };

  const handleSearchResults = (results) => {
    // Show search results in unranked pool
    if (results.length > 0) {
      setUnranked(results);
    }
  };

  const handleAddToTier = async (movie, tier) => {
    // Check if already in a tier
    for (const t of TIERS) {
      if (tierItems[t].some((m) => m.id === movie.id)) {
        setError(`"${movie.title}" is already in tier ${t}`);
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    const dragId = `${tier}-${movie.id}`;
    const movieWithDragId = { ...movie, dragId };

    // Optimistic update
    setTierItems((prev) => ({
      ...prev,
      [tier]: [...prev[tier], movieWithDragId],
    }));
    setUnranked((prev) => prev.filter((m) => m.id !== movie.id));

    if (user && activeTierList) {
      try {
        const result = await addTierItem(activeTierList.id, movie.id, tier);
        // Update itemId from server
        setTierItems((prev) => ({
          ...prev,
          [tier]: prev[tier].map((m) =>
            m.id === movie.id ? { ...m, itemId: result.id } : m
          ),
        }));
      } catch {
        // Revert on error
        setTierItems((prev) => ({
          ...prev,
          [tier]: prev[tier].filter((m) => m.id !== movie.id),
        }));
        setUnranked((prev) => [...prev, movie]);
        setError('Failed to add movie to tier');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleRemoveFromTier = async (movie) => {
    // Find which tier the movie is in
    let sourceTier = null;
    for (const t of TIERS) {
      if (tierItems[t].some((m) => m.id === movie.id || m.dragId === movie.dragId)) {
        sourceTier = t;
        break;
      }
    }
    if (!sourceTier) return;

    // Optimistic update
    setTierItems((prev) => ({
      ...prev,
      [sourceTier]: prev[sourceTier].filter((m) => m.id !== movie.id),
    }));
    setUnranked((prev) => [...prev, movie]);

    if (user && activeTierList && movie.itemId) {
      try {
        await removeTierItem(activeTierList.id, movie.itemId);
      } catch {
        // Revert
        setTierItems((prev) => ({
          ...prev,
          [sourceTier]: [...prev[sourceTier], movie],
        }));
        setUnranked((prev) => prev.filter((m) => m.id !== movie.id));
      }
    }
  };

  const findTierAndIndex = (id) => {
    for (const tier of TIERS) {
      const idx = tierItems[tier].findIndex((m) => m.dragId === id);
      if (idx !== -1) return { tier, index: idx };
    }
    // Check unranked
    const uIdx = unranked.findIndex((m) => m.dragId === id || `unranked-${m.id}` === id);
    if (uIdx !== -1) return { tier: 'unranked', index: uIdx };
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data?.current;
    const overContainerId = over.id;

    // Determine destination tier from the droppable ID
    let destTier = null;
    if (typeof overContainerId === 'string' && overContainerId.startsWith('tier-')) {
      destTier = overContainerId.replace('tier-', '');
    } else {
      // Might be dropping on another item — find its tier
      const overLocation = findTierAndIndex(overContainerId);
      if (overLocation && overLocation.tier !== 'unranked') {
        destTier = overLocation.tier;
      }
    }

    if (!destTier || !TIERS.includes(destTier)) return;

    const sourceTier = activeData?.tier;
    const movie = activeData?.movie;
    if (!movie) return;

    if (sourceTier === destTier) {
      // Reorder within same tier
      const oldIdx = tierItems[destTier].findIndex((m) => m.dragId === active.id);
      const overLocation = findTierAndIndex(over.id);
      const newIdx = overLocation ? overLocation.index : tierItems[destTier].length;
      if (oldIdx !== -1 && oldIdx !== newIdx) {
        setTierItems((prev) => ({
          ...prev,
          [destTier]: arrayMove(prev[destTier], oldIdx, newIdx),
        }));
      }
      return;
    }

    if (sourceTier && TIERS.includes(sourceTier)) {
      // Move between tiers
      const movieData = tierItems[sourceTier].find((m) => m.dragId === active.id);
      if (!movieData) return;

      const newDragId = `${destTier}-${movieData.id}`;
      const updatedMovie = { ...movieData, dragId: newDragId };

      setTierItems((prev) => ({
        ...prev,
        [sourceTier]: prev[sourceTier].filter((m) => m.dragId !== active.id),
        [destTier]: [...prev[destTier], updatedMovie],
      }));

      if (user && activeTierList && movieData.itemId) {
        try {
          await updateTierItem(activeTierList.id, movieData.itemId, { tier: destTier });
        } catch {
          // Revert
          setTierItems((prev) => ({
            ...prev,
            [sourceTier]: [...prev[sourceTier], movieData],
            [destTier]: prev[destTier].filter((m) => m.id !== movieData.id),
          }));
        }
      }
    }
  };

  const handleDragOver = (event) => {
    // This enables dragging between containers
  };

  // Find active movie for drag overlay
  const getActiveMovie = () => {
    if (!activeId) return null;
    for (const tier of TIERS) {
      const movie = tierItems[tier].find((m) => m.dragId === activeId);
      if (movie) return movie;
    }
    return null;
  };

  const activeMovie = getActiveMovie();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading tier lists...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Grid3X3 className="w-8 h-8 text-purple-400" />
            Tier Lists
          </h1>
          <p className="text-gray-400 mt-1">
            {user
              ? activeTierList
                ? `Editing: ${activeTierList.name}`
                : 'Create a tier list to get started'
              : 'Demo mode — sign in to save your rankings'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tier list selector */}
          {tierLists.length > 0 && (
            <select
              value={activeTierList?.id || ''}
              onChange={async (e) => {
                const list = tierLists.find((l) => l.id === parseInt(e.target.value) || l.id === e.target.value);
                if (list) {
                  const fullList = await getTierList(list.id);
                  setActiveTierList(fullList);
                  organizeTierItems(fullList.items || []);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              {tierLists.map((list) => (
                <option key={list.id} value={list.id} className="bg-navy-800">
                  {list.name}
                </option>
              ))}
            </select>
          )}

          {user && (
            <>
              {showCreateForm ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    placeholder="List name..."
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 w-40"
                    autoFocus
                  />
                  <button onClick={handleCreateList} className="btn-primary py-2.5 px-4 text-sm">
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-secondary py-2.5 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New List
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main tier area */}
        <div className="flex-1 space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            {TIERS.map((tier) => (
              <TierRow
                key={tier}
                tier={tier}
                items={tierItems[tier]}
                onRemoveItem={handleRemoveFromTier}
              />
            ))}

            <DragOverlay>
              {activeMovie ? (
                <div className="w-28 h-40 rounded-xl overflow-hidden border-2 border-purple-500 shadow-2xl shadow-purple-500/30 opacity-90">
                  {(activeMovie.poster || activeMovie.poster_url) && (activeMovie.poster || activeMovie.poster_url) !== 'N/A' ? (
                    <img src={activeMovie.poster || activeMovie.poster_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-navy-700 flex items-center justify-center">
                      <ImageOff className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Sidebar: Search + Unranked Pool */}
        <div className="lg:w-80 space-y-4">
          <div className="glass-card p-4">
            <h3 className="font-heading font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              Add Movies
            </h3>
            <SearchBar
              onResults={handleSearchResults}
              onSelect={(movie) => setSelectedMovie(movie)}
              placeholder="Search to add..."
            />
          </div>

          {/* Unranked pool */}
          <div className="glass-card p-4">
            <h3 className="font-heading font-semibold text-white mb-3">
              Unranked Movies
            </h3>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {unranked.length > 0 ? (
                unranked.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-navy-700">
                      {(movie.poster || movie.poster_url) && (movie.poster || movie.poster_url) !== 'N/A' ? (
                        <img src={movie.poster || movie.poster_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{movie.title}</p>
                      <p className="text-xs text-gray-500">{movie.year}</p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {TIERS.map((t) => (
                        <button
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToTier(movie, t);
                          }}
                          className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center transition-transform hover:scale-110 ${
                            t === 'S' ? 'bg-tier-s/20 text-tier-s border border-tier-s/30' :
                            t === 'A' ? 'bg-tier-a/20 text-tier-a border border-tier-a/30' :
                            t === 'B' ? 'bg-tier-b/20 text-tier-b border border-tier-b/30' :
                            t === 'C' ? 'bg-tier-c/20 text-tier-c border border-tier-c/30' :
                            'bg-tier-d/20 text-tier-d border border-tier-d/30'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Search for movies to add to your tier list
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onAddToTier={handleAddToTier}
        />
      )}
    </motion.div>
  );
}
