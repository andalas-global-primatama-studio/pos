import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { LogOut, User, Settings } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 lg:ml-64 flex items-center justify-between px-4 lg:px-8">
      <div className="flex-1">
        {/* Placeholder for page title or breadcrumb */}
      </div>
      
      <div className="flex items-center space-x-3">
        <Link to="/pengaturan">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings size={20} className="text-gray-600" />
          </button>
        </Link>
        
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
          <User size={18} />
          <span>{user?.nama || 'User'}</span>
          <Badge variant={user?.role === 'super_admin' ? 'warning' : user?.role === 'admin' ? 'primary' : 'default'}>
            {user?.role || 'User'}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center space-x-2"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;

// Badge component for header
const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

