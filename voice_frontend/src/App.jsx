import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Home     from './pages/Home';
import Session  from './pages/Session';
import Journey  from './pages/Journey';
import Login    from './pages/Login';
import Register from './pages/Register';
import Profile  from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* ── Public ─────────────────────────────────────── */}
          <Route path="/login"    element={<Login />}    />
          <Route path="/register" element={<Register />} />

          {/* ── Protected ──────────────────────────────────── */}
          <Route path="/" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />
          <Route path="/session/eva" element={
            <ProtectedRoute><Session /></ProtectedRoute>
          } />
          <Route path="/journey" element={
            <ProtectedRoute><Journey /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />

          {/* ── Redirects ──────────────────────────────────── */}
          <Route path="/session/:id" element={<Navigate to="/session/eva" replace />} />
          <Route path="/companions"  element={<Navigate to="/"             replace />} />
          <Route path="*"            element={<Navigate to="/"             replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
