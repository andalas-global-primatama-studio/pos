import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { storage, STORAGE_KEYS } from '../../utils/localStorage';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  FileText,
  Menu,
  X,
  Settings,
  TrendingDown
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get logo from settings
  const settings = storage.get(STORAGE_KEYS.SETTINGS) || {};
  const logo = settings.logo;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'manager'] },
    { path: '/users', label: 'Manajemen User', icon: Users, roles: ['super_admin', 'admin'] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: ['super_admin', 'admin', 'manager'] },
    { path: '/kasir', label: 'Kasir', icon: ShoppingCart, roles: ['super_admin', 'admin', 'manager', 'kasir'] },
    { path: '/pengeluaran', label: 'Pengeluaran', icon: TrendingDown, roles: ['super_admin', 'admin', 'manager'] },
  { path: '/laporan', label: 'Laporan', icon: FileText, roles: ['super_admin', 'admin', 'manager', 'kasir'] },
  ];

  // Filter menu based on user role
  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white z-30 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-2">
            {logo && (
              <img 
                src={logo} 
                alt="Logo Toko" 
                className="w-10 h-10 object-contain rounded"
              />
            )}
            <div>
              <h1 className="text-xl font-bold">{settings.companyName || 'Sistem POS'}</h1>
              <p className="text-blue-200 text-xs mt-0.5">Point of Sale</p>
            </div>
          </div>
        </div>

        <nav className="mt-8 px-3">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg mb-1.5 transition-colors text-sm ${
                  isActive(item.path)
                    ? 'bg-white bg-opacity-20 text-white font-semibold'
                    : 'text-blue-200 hover:bg-white hover:bg-opacity-10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-sm font-medium">{user?.nama || 'User'}</p>
            <p className="text-xs text-blue-200 mt-1">{user?.role || 'Guest'}</p>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;

