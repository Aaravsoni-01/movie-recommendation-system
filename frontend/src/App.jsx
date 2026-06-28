import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tiers from './pages/Tiers';
import Studios from './pages/Studios';
import StudioDetail from './pages/StudioDetail';
import Recommendations from './pages/Recommendations';
import Timeline from './pages/Timeline';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/tiers" element={<Tiers />} />
            <Route path="/studios" element={<Studios />} />
            <Route path="/studios/:name" element={<StudioDetail />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </AuthProvider>
  );
}
