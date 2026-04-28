import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveSession } from '../../context/ActiveSessionContext';
import { CHAT_ENDPOINTS } from '../../constants/api';

const TOAST_DURATION = 12000;

const SessionToast = () => {
  const { activeSession, stopTracking } = useActiveSession();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);

  const isTerminal = activeSession?.phase === 'completed' || activeSession?.phase === 'error';
  const isSuccess = activeSession?.phase === 'completed';

  useEffect(() => {
    if (isTerminal) setVisible(true);
  }, [isTerminal]);

  useEffect(() => {
    if (!visible) return;
    setProgress(100);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      if (remaining === 0) { clearInterval(interval); handleDismiss(); }
    }, 50);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible || !activeSession) return null;

  const handleDismiss = () => { setVisible(false); stopTracking(); };
  const handleGoToSession = () => { navigate(`/sesion/${activeSession.sessionId}`); handleDismiss(); };
  const handleDownload = () => { window.open(CHAT_ENDPOINTS.DOWNLOAD(activeSession.sessionId), '_blank'); };

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden ${isSuccess ? 'bg-white dark:bg-stone-900 border border-lime-200 dark:border-lime-800' : 'bg-white dark:bg-stone-900 border border-red-200 dark:border-red-800'}`}>
      <div className="h-1 w-full bg-stone-100 dark:bg-stone-800">
        <div className={`h-full transition-none ${isSuccess ? 'bg-lime-400' : 'bg-red-400'}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-xl ${isSuccess ? 'text-lime-500' : 'text-red-500'}`}>
              {isSuccess ? 'check_circle' : 'error'}
            </span>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              {isSuccess ? 'Tu material se ha generado' : 'Error en la generacion'}
            </p>
          </div>
          <button onClick={handleDismiss} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        {!isSuccess && activeSession.error && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-3 leading-relaxed">{activeSession.error}</p>
        )}
        <div className="flex gap-2">
          <button onClick={handleGoToSession} className="flex-1 py-2 px-3 rounded-xl text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Ver sesion
          </button>
          {isSuccess && (
            <button onClick={handleDownload} className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-lime-500 hover:bg-lime-600 text-white transition-colors flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-sm">download</span>
              Descargar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionToast;
