import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Film, Star, Award, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { GenrePieChart, TierBarChart } from '../components/StatsChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_rated: 0,
    avg_rating: 0,
    favorite_genre: 'Unknown',
    recent_ratings: [],
    genre_distribution: {},
    tier_breakdown: {}
  });

  useEffect(() => {
    // In a real app, fetch from api.getDashboard()
    // Mocking for now since analytics endpoint might need auth and actual data
    setTimeout(() => {
      setStats({
        total_rated: 142,
        avg_rating: 8.2,
        favorite_genre: 'Sci-Fi',
        genre_distribution: [
          { name: 'Action', value: 30 },
          { name: 'Sci-Fi', value: 45 },
          { name: 'Drama', value: 25 },
          { name: 'Comedy', value: 15 },
          { name: 'Horror', value: 10 }
        ],
        tier_breakdown: [
          { name: 'S', count: 12 },
          { name: 'A', count: 45 },
          { name: 'B', count: 50 },
          { name: 'C', count: 25 },
          { name: 'D', count: 10 }
        ],
        recent_ratings: [
          { id: 1, title: 'Inception', tier: 'S', date: '2 days ago', poster_url: 'https://via.placeholder.com/150x225.png?text=Inception' },
          { id: 2, title: 'Interstellar', tier: 'S', date: '3 days ago', poster_url: 'https://via.placeholder.com/150x225.png?text=Interstellar' },
          { id: 3, title: 'The Matrix', tier: 'A', date: '5 days ago', poster_url: 'https://via.placeholder.com/150x225.png?text=The+Matrix' },
        ]
      });
    }, 1000);
  }, []);

  const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-6">
      <div className={`p-4 rounded-xl bg-white/5 ${colorClass}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold text-white font-outfit">{value}</p>
      </div>
    </div>
  );

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 max-w-md p-8 glass-card rounded-3xl">
            <BarChart3 className="w-16 h-16 text-purple-400 mx-auto" />
            <h2 className="text-3xl font-outfit font-bold text-white">Your Analytics</h2>
            <p className="text-gray-300">Sign in to view your personalized tier list analytics, rating history, and watch stats.</p>
            <a href="/login" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all">
              Sign In
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-outfit font-bold text-white mb-2">Welcome back, {user?.username}</h1>
          <p className="text-gray-400 text-lg">Here's a breakdown of your cinematic journey.</p>
        </header>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Movies Rated" value={stats.total_rated} icon={Film} colorClass="text-blue-400" />
          <StatCard title="Avg Rating" value={stats.avg_rating} icon={Star} colorClass="text-yellow-400" />
          <StatCard title="Top Genre" value={stats.favorite_genre} icon={Award} colorClass="text-purple-400" />
          <StatCard title="Watch Time" value="284h" icon={Clock} colorClass="text-emerald-400" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <h3 className="text-xl font-outfit font-bold text-white mb-6">Genre Distribution</h3>
            <div className="h-80 w-full">
              <GenrePieChart data={stats.genre_distribution} />
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <h3 className="text-xl font-outfit font-bold text-white mb-6">Tier Breakdown</h3>
            <div className="h-80 w-full">
              <TierBarChart data={stats.tier_breakdown} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10">
          <h3 className="text-2xl font-outfit font-bold text-white mb-6 flex items-center gap-3">
            <Clock className="w-6 h-6 text-purple-400" />
            Recent Activity
          </h3>
          
          <div className="space-y-4">
            {stats.recent_ratings.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                <img src={item.poster_url} alt={item.title} className="w-16 h-24 object-cover rounded-lg shadow-md" />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white">{item.title}</h4>
                  <p className="text-gray-400 text-sm mt-1">{item.date}</p>
                </div>
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-outfit font-bold text-2xl
                  ${item.tier === 'S' ? 'bg-tier-s/20 text-tier-s border border-tier-s/50' : 
                    item.tier === 'A' ? 'bg-tier-a/20 text-tier-a border border-tier-a/50' : 
                    item.tier === 'B' ? 'bg-tier-b/20 text-tier-b border border-tier-b/50' : 
                    item.tier === 'C' ? 'bg-tier-c/20 text-tier-c border border-tier-c/50' : 
                    'bg-tier-d/20 text-tier-d border border-tier-d/50'}`}>
                  {item.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
