import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Session from './pages/Session';
import Journey from './pages/Journey';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/eva" element={<Session />} />
        <Route path="/session/:id" element={<Navigate to="/session/eva" replace />} />
        <Route path="/companions" element={<Navigate to="/" replace />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
