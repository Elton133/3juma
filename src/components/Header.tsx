import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';

const NAV_ITEMS = [
  { path: ROUTES.home, label: 'Find Workers' },
  { path: ROUTES.workerLogin, label: 'Worker Portal' },
];

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={ROUTES.home} className="flex items-center group transform active:scale-95 transition-all">
          <img src="/3juma.png" alt="Ejuma — home" className="h-10 w-auto object-contain" />
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
          {user ? (
            <div className="flex items-center gap-6 pl-6 border-l border-gray-100">
              {user.role === 'customer' && (
                <Link
                  to={ROUTES.customerProfile}
                  className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                    location.pathname === ROUTES.customerProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  Profile
                </Link>
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{user.name}</span>
              <button onClick={logout} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <Link to={ROUTES.login} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 rounded-xl transition-all">Sign In</Link>
              <Link to={ROUTES.register} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black transition-all">Join 3juma</Link>
            </div>
          )}
        </nav>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-900">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden glass absolute top-16 left-0 w-full border-b border-white/20 p-6 space-y-4 shadow-lg z-50 animate-in slide-in-from-top duration-300">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left px-5 py-4 rounded-2xl bg-white/50 font-black text-xs uppercase tracking-widest text-gray-900 border border-white/40"
            >
              {item.label}
            </Link>
          ))}
          {!user ? (
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Link to={ROUTES.login} onClick={() => setMobileMenuOpen(false)} className="px-5 py-4 bg-white border border-gray-100 rounded-2xl text-center font-black text-xs uppercase tracking-widest text-gray-900">Sign In</Link>
              <Link to={ROUTES.register} onClick={() => setMobileMenuOpen(false)} className="px-5 py-4 bg-gray-900 rounded-2xl text-center font-black text-xs uppercase tracking-widest text-white shadow-xl">Join Us</Link>
            </div>
          ) : (
            <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left px-5 py-4 rounded-2xl bg-red-50 font-black text-xs uppercase tracking-widest text-red-600 border border-red-100 mt-4">
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
