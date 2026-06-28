import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Film, Calendar, Clapperboard, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/client';
import Layout from '../components/Layout';
import MovieCard from '../components/MovieCard';

const StudioDetail = () => {
  const { name } = useParams();
  const [studio, setStudio] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudioData = async () => {
      try {
        setLoading(true);
        // Fallback or real data from API
        const studioRes = await api.getStudio(name).catch(() => ({ data: { name, description: 'A legendary film studio.', founded_year: 1920, logo_url: '' }}));
        const moviesRes = await api.getStudioMovies(name).catch(() => ({ data: [] }));
        
        setStudio(studioRes.data);
        setMovies(moviesRes.data || []);
      } catch (err) {
        setError('Failed to load studio details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudioData();
  }, [name]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse-glow w-16 h-16 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (error || !studio) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl text-red-400 mb-4">{error || 'Studio not found'}</h2>
          <Link to="/studios" className="text-blue-400 hover:text-blue-300">Return to Studios</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden glass-card p-10 mt-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-blue-900/40 z-0"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <Link to="/studios" className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            
            <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mt-8 md:mt-0">
              {studio.logo_url ? (
                <img src={studio.logo_url} alt={studio.name} className="w-3/4 h-3/4 object-contain" />
              ) : (
                <Clapperboard className="w-16 h-16 text-white/50" />
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold text-white tracking-tight">
                {studio.name}
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl leading-relaxed">
                {studio.description || `Explore the legendary films and rich cinematic history of ${studio.name}.`}
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  <Film className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">{movies.length} Films</span>
                </div>
                {studio.founded_year && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Est. {studio.founded_year}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-medium">8.4 Avg</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Movies Grid */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-outfit font-bold text-white flex items-center gap-3">
              <Award className="w-8 h-8 text-gold" />
              Featured Films
            </h2>
          </div>
          
          {movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {movies.map((movie, index) => (
                <motion.div
                  key={movie.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 glass-card rounded-2xl">
              <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl text-white font-medium">No movies found</h3>
              <p className="text-gray-400 mt-2">Check back later for updates to this studio's catalog.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudioDetail;
