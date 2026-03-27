import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { path: '/', label: 'Find Workers' },
  { path: '/worker', label: 'Worker Portal' },
  { path: '/admin', label: 'Dispatcher' },
];

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group transform active:scale-95 transition-all">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-xl text-gray-900 tracking-tighter">3juma</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'text-gray-900 scale-105' : 'text-gray-400 hover:text-gray-900'}`}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <button onClick={logout} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          )}
        </nav>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-900">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden glass absolute top-16 left-0 w-full border-b border-white/20 p-6 space-y-4 shadow-lg z-50">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left px-5 py-4 rounded-2xl bg-white/50 font-black text-xs uppercase tracking-widest text-gray-900"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left px-5 py-4 rounded-2xl bg-red-50 font-black text-xs uppercase tracking-widest text-red-600">
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
