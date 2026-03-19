import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import MyBooks from './pages/MyBooks';
import Admin from './pages/Admin';


function RequireAuth({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 w-full">
            <Navbar />
            <main className="container mx-auto py-6 px-4">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/my-books" element={<RequireAuth><MyBooks /></RequireAuth>} />
                <Route path="/admin" element={<RequireAuth requireAdmin><Admin /></RequireAuth>} />
              </Routes>
            </main>
          </div>
          <Toaster richColors position="bottom-right" />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
