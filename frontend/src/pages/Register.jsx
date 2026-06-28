import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const success = await register(formData.username, formData.email, formData.password);
      if (success) {
        navigate('/login');
      } else {
        setError('Registration failed. Username or email might already exist.');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center relative px-4 py-12">
        {/* Animated Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass-card p-8 sm:p-10 rounded-3xl border border-white/10 relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-outfit font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Join CineTier to build your custom tier lists</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all outline-none"
                  placeholder="Choose a username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all outline-none"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all outline-none"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 transition-all outline-none"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign in instead
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Register;
