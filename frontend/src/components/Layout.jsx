import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film, Star, Grid3X3, Clock, BarChart3, User, LogIn, Menu, X, Search,
  Compass, Clapperboard, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home', icon: Film },
  { to: '/tiers', label: 'Tier Lists', icon: Grid3X3 },
  { to: '/studios', label: 'Studios', icon: Clapperboard },
  { to: '/recommendations', label: 'Discover', icon: Compass },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
];

function NavItem({ to, label, icon: Icon, mobile, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
          mobile ? 'text-base' : 'text-sm'
        } ${
          isActive
            ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/20 text-white border border-purple-500/30'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0 transition-colors duration-300 group-hover:text-purple-400" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Top Navbar ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy-900/80 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">
                <span className="text-white">Cine</span>
                <span className="gradient-text">Tier</span>
              </span>
            </Link>
          </div>

          {/* Center: Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Search + Auth */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/tiers')}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 text-sm"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search movies...</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Mobile Menu Overlay ────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed top-16 left-0 bottom-0 z-50 w-72 bg-navy-900/95 backdrop-blur-2xl border-r border-white/5 p-4 flex flex-col gap-2 lg:hidden overflow-y-auto"
            >
              {navItems.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  mobile
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}

              <div className="mt-auto pt-4 border-t border-white/5">
                {user ? (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.username}</p>
                      <button onClick={logout} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-white font-medium"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ───────────────────────────── */}
      <main className="flex-1 pt-16">
        <div className="min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-navy-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-lg">
                <span className="text-white">Cine</span>
                <span className="gradient-text">Tier</span>
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Built with 🎬 for movie lovers everywhere
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>© {new Date().getFullYear()} CineTier</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
