import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-primary">
            <BookOpen className="h-6 w-6" />
            <span>Library</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className={`text-sm font-semibold transition-colors pb-1 border-b-2 ${isActive('/') ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>Dashboard</Link>
            {user.role !== 'ADMIN' && (
              <Link to="/my-books" className={`text-sm font-semibold transition-colors pb-1 border-b-2 ${isActive('/my-books') ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>My Books</Link>
            )}
            {user.role === 'ADMIN' && (
              <Link to="/admin" className={`text-sm font-semibold transition-colors pb-1 border-b-2 ${isActive('/admin') ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>Admin Panel</Link>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
          <button onClick={handleLogout} className="text-sm border border-input hover:bg-gray-100 h-9 px-3 rounded-md transition-colors hover:text-red-800 cursor-pointer">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
