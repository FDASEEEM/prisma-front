/**
 * SideNav Component
 * Navegación lateral (desktop) con responsive
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';

const SideNav = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/nueva-sesion', label: 'Nueva Sesión', icon: 'add_circle' },
    { path: '/dashboard',    label: 'Escritorio',   icon: 'dashboard' },
    { path: '/historial',    label: 'Historial',    icon: 'history' },
    { path: '/paci',         label: 'Alumnos',      icon: 'group' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col p-8 space-y-4 h-screen w-72 rounded-r-[3rem] fixed left-0 top-0 z-40 bg-stone-50 dark:bg-stone-950 shadow-2xl shadow-stone-900/10 border-r border-stone-200/50 dark:border-stone-800/50 overflow-hidden">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="flex items-center gap-4 group">
            <img
              src="/logos/prisma_logo.png"
              alt="P.R.I.S.M.A. Logo"
              className="w-12 h-12 rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
            />
            <div>
              <h1 className="font-headline text-xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-lime-800 dark:group-hover:text-lime-400 transition-colors">P.R.I.S.M.A.</h1>
              <p className="text-xs text-stone-500 font-medium tracking-wide uppercase">Modelo Agéntico</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-grow space-y-2 overflow-y-auto pr-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 p-3 rounded-full transition-all duration-300 font-medium text-sm ${
                isActive(item.path)
                  ? 'bg-stone-200/50 dark:bg-stone-800/50 text-lime-900 dark:text-lime-100'
                  : 'text-stone-600 dark:text-stone-400 hover:translate-x-1 hover:text-lime-800'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-6 border-t border-stone-200/50 dark:border-stone-800/50 space-y-4">
          <Link
            to="/ayuda"
            className="flex items-center gap-4 p-3 rounded-full text-stone-600 dark:text-stone-400 hover:translate-x-1 transition-transform duration-200 hover:text-lime-800 font-medium text-sm w-full"
          >
            <span className="material-symbols-outlined">help_outline</span>
            <span>Ayuda</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-4 p-3 rounded-full text-stone-600 dark:text-stone-400 hover:translate-x-1 transition-transform duration-200 hover:text-red-600 font-medium text-sm w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Salir</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Button (hidden on desktop) */}
      <button className="md:hidden fixed bottom-6 right-6 z-50 bg-primary text-on-primary p-4 rounded-full shadow-lg hover:shadow-xl transition-all">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </>
  );
};

export default SideNav;
