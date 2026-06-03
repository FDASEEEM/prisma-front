/**
 * TopNav Component
 * Navegación superior con notificaciones y perfil
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import adminPanelService from '../../services/adminPanelService';
import UserAvatar from '../ui/UserAvatar';

const SERVICE_STATUS_URLS = [
  { name: 'Auth', url: 'http://localhost:3001/api/health' },
  { name: 'Docs', url: 'http://localhost:3002/api/health' },
  { name: 'Perfil Alumno', url: 'http://localhost:3005/health' },
];

const TopNav = ({ title = 'Aula Orgánica' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [serviceStatus, setServiceStatus] = useState(
    SERVICE_STATUS_URLS.reduce((acc, s) => ({ ...acc, [s.name]: 'checking' }), {})
  );
  const settingsRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const checkServices = async () => {
      const results = {};
      await Promise.all(
        SERVICE_STATUS_URLS.map(async ({ name, url }) => {
          try {
            const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
            results[name] = res.ok ? 'up' : 'down';
          } catch {
            results[name] = 'down';
          }
        })
      );
      setServiceStatus(results);
    };

    checkServices();
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await adminPanelService.getActiveAnnouncements();
        setAnnouncements(data || []);
      } catch {
        setAnnouncements([]);
      }
    };

    loadAnnouncements();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setIsSettingsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl shadow-sm shadow-stone-200/50 dark:shadow-stone-900/20 border-b border-stone-200/50 dark:border-stone-800/50 transition-all duration-300">
      <div className="flex justify-between items-center px-6 md:pl-72 md:pr-10 h-full w-full">
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
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-stone-500 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 rounded-full transition-all duration-300 relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {/* Notification Badge */}
              {announcements.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-error rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                  {announcements.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/15 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-outline-variant/15 flex items-center justify-between">
                  <p className="text-sm font-medium text-on-surface">Anuncios del sistema</p>
                  {announcements.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {announcements.length} nuevo{announcements.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {announcements.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 mb-2">notifications_off</span>
                      <p className="text-sm text-on-surface-variant">No hay anuncios activos</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-outline-variant/10">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="px-4 py-3 hover:bg-surface-container-low transition-colors cursor-pointer">
                          <p className="text-sm font-medium text-on-surface line-clamp-1">{announcement.title}</p>
                          <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{announcement.body}</p>
                          <p className="text-[10px] text-on-surface-variant/70 mt-1">
                            {new Date(announcement.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <div className="relative" ref={settingsRef}>
            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 text-stone-500 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 rounded-full transition-all duration-300"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>

            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/15 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-outline-variant/15">
                  <p className="text-sm font-medium text-on-surface">Status</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {SERVICE_STATUS_URLS.map(({ name }) => {
                    const status = serviceStatus[name];
                    const isUp = status === 'up';
                    const isDown = status === 'down';
                    return (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-sm text-on-surface">{name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${isUp ? 'text-success' : isDown ? 'text-error' : 'text-on-surface-variant'}`}>
                            {status === 'checking' ? 'checking...' : isUp ? 'up' : 'down'}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-success' : isDown ? 'bg-error' : 'bg-warning'}`}></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 hover:opacity-80 rounded-full transition-all duration-300"
            >
              <UserAvatar name={user?.nombre || 'Usuario'} size="sm" />
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
