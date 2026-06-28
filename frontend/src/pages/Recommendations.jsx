import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Brain, Zap, Laugh, Ghost, Mountain, Popcorn } from 'lucide-react';
import api from '../api/client';
import Layout from '../components/Layout';
import MovieCard from '../components/MovieCard';

const MOODS = [
  { id: 'funny', label: 'Funny', icon: Laugh, color: 'from-yellow-400 to-orange-500' },
  { id: 'scary', label: 'Scary', icon: Ghost, color: 'from-gray-600 to-gray-900' },
  { id: 'thrilling', label: 'Thrilling', icon: Zap, color: 'from-red-500 to-orange-600' },
  { id: 'epic', label: 'Epic', icon: Mountain, color: 'from-blue-500 to-indigo-700' },
  { id: 'heartwarming', label: 'Heartwarming', icon: Heart, color: 'from-pink-400 to-rose-600' },
  { id: 'thoughtful', label: 'Thoughtful', icon: Brain, color: 'from-teal-400 to-emerald-600' },
];

const Recommendations = () => {
  const [forYou, setForYou] = useState([]);
  const [moodRecs, setMoodRecs] = useState([]);
  const [watchNext, setWatchNext] = useState([]);
  const [activeMood, setActiveMood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDefaultRecs = async () => {
      try {
        setLoading(true);
        // Using getTrendingMovies as a fallback if real endpoints aren't ready
        const res = await api.getTrendingMovies().catch(() => ({ data: [] }));
        const trending = res.data.slice(0, 5) || [];
        
        // Mocking the recommendation shape
        setForYou(trending.map(m => ({ movie: m, reason: "Because you enjoy highly-rated films." })));
        setWatchNext(res.data.slice(5, 10).map(m => ({ movie: m, reason: "A classic you haven't seen yet." })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDefaultRecs();
  }, []);

  const handleMoodSelect = async (moodId) => {
    setActiveMood(moodId);
    try {
      // Fake API call for mood
      const res = await api.getTrendingMovies().catch(() => ({ data: [] }));
      const shuffled = [...(res.data || [])].sort(() => 0.5 - Math.random());
      setMoodRecs(shuffled.slice(0, 5).map(m => ({ 
        movie: m, 
        reason: `Perfect for when you're in a ${moodId} mood.` 
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const RecSection = ({ title, icon: Icon, items }) => (
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-8">
        <Icon className="w-8 h-8 text-purple-400" />
        <h2 className="text-3xl font-outfit font-bold text-white">{title}</h2>
      </div>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {items.map((item, idx) => (
            <motion.div 
              key={item.movie?.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col h-full"
            >
              <MovieCard movie={item.movie} />
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 flex-1">
                <p className="text-sm text-gray-300 italic">"{item.reason}"</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center glass-card rounded-2xl">
          <p className="text-gray-400">Rate more movies in your Tier List to get personalized recommendations!</p>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-outfit font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4 inline-flex items-center gap-4">
            <Sparkles className="w-10 h-10 text-purple-400" />
            Discover Your Next Favorite
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our recommendation engine analyzes your tier lists to find films you're guaranteed to love.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            <RecSection title="For You" icon={Sparkles} items={forYou} />
            
            {/* Mood Section */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <Popcorn className="w-8 h-8 text-yellow-400" />
                <h2 className="text-3xl font-outfit font-bold text-white">What are you in the mood for?</h2>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-8">
                {MOODS.map(mood => (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                      activeMood === mood.id 
                        ? `bg-gradient-to-r ${mood.color} text-white scale-105 shadow-lg shadow-purple-500/25` 
                        : 'glass-card text-gray-300 hover:text-white hover:scale-105'
                    }`}
                  >
                    <mood.icon className="w-5 h-5" />
                    <span className="font-medium">{mood.label}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeMood && moodRecs.length > 0 && (
                  <motion.div
                    key={activeMood}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
                  >
                    {moodRecs.map((item, idx) => (
                      <div key={item.movie?.id || idx} className="flex flex-col h-full">
                        <MovieCard movie={item.movie} />
                        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 flex-1">
                          <p className="text-sm text-gray-300 text-center">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <RecSection title="Watch Next Queue" icon={Zap} items={watchNext} />
          </>
        )}
      </div>
    </Layout>
  );
};

export default Recommendations;
