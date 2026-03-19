import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import MyBooks from './pages/MyBooks';
import Admin from './pages/Admin';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) return null; // Or a loading spinner
  
  // Need to use effect or layout for consistent routing instead of returning null on fast loads. 
  // Let the wrapper handle the auth check
  const MainContent = () => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (requireAdmin && user?.role !== 'ADMIN') return <Navigate to="/" />;
    
    return <>{children}</>;
  };

  return <MainContent />;
};

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
