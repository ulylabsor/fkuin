import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminDosenSarjana from './pages/AdminDosenSarjana';
import AdminPembimbingKlinik from './pages/AdminPembimbingKlinik';
import AdminTendik from './pages/AdminTendik';

function AdminRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<Dashboard />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/dosen-sarjana" element={<AdminRoute><AdminDosenSarjana /></AdminRoute>} />
          <Route path="/admin/pembimbing-klinik" element={<AdminRoute><AdminPembimbingKlinik /></AdminRoute>} />
          <Route path="/admin/tendik" element={<AdminRoute><AdminTendik /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
