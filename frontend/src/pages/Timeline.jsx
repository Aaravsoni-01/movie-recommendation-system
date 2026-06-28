import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Filter, Film } from 'lucide-react';
import api from '../api/client';
import Layout from '../components/Layout';
import MovieCard from '../components/MovieCard';

const Timeline = () => {
  const [moviesByDecade, setMoviesByDecade] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        // Fallback or real data
        const res = await api.getMovies({ limit: 100 }).catch(() => ({ data: { items: [] } }));
        const movies = res.data.items || res.data || [];
        
        // Group by decade
        const grouped = movies.reduce((acc, movie) => {
          if (!movie.year) return acc;
          const decade = Math.floor(movie.year / 10) * 10;
          if (!acc[`${decade}s`]) {
            acc[`${decade}s`] = [];
          }
          acc[`${decade}s`].push(movie);
          return acc;
        }, {});
        
        // Sort decades
        const sorted = Object.keys(grouped).sort().reduce((acc, key) => {
          // Sort movies within decade by year
          acc[key] = grouped[key].sort((a, b) => a.year - b.year);
          return acc;
        }, {});
        
        setMoviesByDecade(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

  return (
    <Layout>
      <div className="max-w-screen-2xl mx-auto py-8 px-4 overflow-hidden">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-outfit font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2 inline-flex items-center gap-4">
              <Clock className="w-10 h-10 text-blue-400" />
              Chronological Timeline
            </h1>
            <p className="text-gray-400 text-lg">Journey through the history of cinema.</p>
          </div>
          
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg hover:bg-white/10 transition-colors">
              <Filter className="w-4 h-4 text-gray-300" />
              <span className="text-gray-300">Filter</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : Object.keys(moviesByDecade).length > 0 ? (
          <div className="relative">
            {/* Horizontal timeline line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/50 to-pink-500/20 transform -translate-y-1/2 z-0 hidden lg:block rounded-full"></div>

            <div className="space-y-24 lg:space-y-32 relative z-10">
              {Object.entries(moviesByDecade).map(([decade, movies], dIdx) => (
                <div key={decade} className="relative">
                  {/* Decade Marker */}
                  <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 mb-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-900/50 border-2 border-blue-400 flex items-center justify-center backdrop-blur-md shadow-lg shadow-blue-500/20">
                      <span className="font-outfit font-bold text-xl text-white">{decade}</span>
                    </div>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-400/50 to-transparent"></div>
                  </motion.div>

                  {/* Movies in Decade */}
                  <div className="flex overflow-x-auto pb-8 gap-6 snap-x custom-scrollbar">
                    {movies.map((movie, mIdx) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: (mIdx % 5) * 0.1 }}
                        className="snap-start min-w-[200px] w-[200px] md:min-w-[250px] md:w-[250px] flex-shrink-0"
                      >
                        <MovieCard movie={movie} />
                        <div className="text-center mt-3 text-gray-400 font-medium bg-black/30 rounded-full py-1">
                          {movie.year}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center glass-card rounded-2xl">
            <Film className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No timeline data available.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Timeline;
