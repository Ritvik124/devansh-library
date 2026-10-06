import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { Login, Register, Forgot } from './pages/Auth';
import { Dashboard, FindSeat, SeatsPublic, MyBookings, Profile } from './pages/Student';
import Admin from './pages/Admin';
import { useApp } from './context/App';
const Guard = ({ children, role }) => { const { user, loading } = useApp(); if (loading) return <p className="p-10 text-center">Loading…</p>; if (!user) return <Navigate to="/login" replace />; if (role && user.role !== role) return <Navigate to="/" replace />; return children; };
export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route path="/" element={<Home />} /><Route path="/seats" element={<SeatsPublic />} />
    <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot" element={<Forgot />} />
    <Route path="/dashboard" element={<Guard role="student"><Dashboard /></Guard>} /><Route path="/find" element={<Guard role="student"><FindSeat /></Guard>} />
    <Route path="/bookings" element={<Guard role="student"><MyBookings /></Guard>} /><Route path="/profile" element={<Guard role="student"><Profile /></Guard>} />
    <Route path="/admin" element={<Guard role="admin"><Admin /></Guard>} /><Route path="*" element={<Navigate to="/" />} /></Route></Routes>;
}
