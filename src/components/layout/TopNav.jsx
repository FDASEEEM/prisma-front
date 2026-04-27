/**
 * TopNav Component
 * Navegación superior con notificaciones y perfil
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Button from '../ui/Button';

const TopNav = ({ title = 'Aula Orgánica' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      navigate('/login', { replace: true });
      setIsProfileOpen(false);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsProfileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl shadow-sm shadow-stone-200/50 dark:shadow-stone-900/20 md:pl-72">
      <div className="flex justify-between items-center px-6 md:px-10 h-full w-full">
        {/* Logo - Mobile only */}
        <div className="md:hidden">
          <img 
            src="/logos/prisma_logo.png" 
            alt="P.R.I.S.M.A. Logo" 
            className="h-8 w-8"
          />
        </div>

        {/* Right Section - Notifications, Settings, Profile */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications Button */}
          <button className="p-2 text-stone-500 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 rounded-full transition-all duration-300 relative">
            <span className="material-symbols-outlined">notifications</span>
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>

          {/* Settings Button */}
          <button className="p-2 text-stone-500 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 rounded-full transition-all duration-300">
            <span className="material-symbols-outlined">settings</span>
          </button>

          {/* Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 rounded-full transition-all duration-300"
            >
              <img
                alt="Profile"
                src={user?.avatar || 'https://via.placeholder.com/32'}
                className="w-8 h-8 rounded-full object-cover shadow-sm"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/15 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-outline-variant/15">
                  <p className="text-sm font-medium text-on-surface">{user?.nombre || 'Usuario'}</p>
                  <p className="text-xs text-on-surface-variant">{user?.email || 'usuario@ejemplo.com'}</p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 hover:bg-surface-container-low transition-colors text-sm text-on-surface flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  Mi Perfil
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low transition-colors text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">settings</span>
                  Configuración
                </button>
                <div className="border-t border-outline-variant/15"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-error/10 transition-colors text-sm text-error flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
