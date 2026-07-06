import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import CheckoutPage from './pages/CheckoutPage';
import MyTicketsPage from './pages/MyTicketsPage';
import TicketScannerPage from './pages/TicketScannerPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import GoogleAuthCallbackPage from './pages/GoogleAuthCallbackPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { showAuthModal, setShowAuthModal, login } = useAuth();

  const handleAuthSuccess = (userData, token) => {
    login(userData, token);
    setShowAuthModal(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/showtime/:showtimeId/seats" element={<SeatSelectionPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/scanner" element={<TicketScannerPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/auth/google/success" element={<GoogleAuthCallbackPage onLoginSuccess={handleAuthSuccess} />} />
        </Routes>
      </main>

      <Footer />

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
