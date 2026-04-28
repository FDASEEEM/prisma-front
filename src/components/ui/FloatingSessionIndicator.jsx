import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useActiveSession } from '../../context/ActiveSessionContext';

const FloatingSessionIndicator = () => {
  const { activeSession } = useActiveSession();
  const navigate = useNavigate();
  const location = useLocation();

  if (!activeSession) return null;
  const { phase, sessionId, currentStep } = activeSession;

  if (phase !== 'running' && phase !== 'awaiting_hitl') return null;
  if (location.pathname === `/sesion/${sessionId}`) return null;

  const isHitl = phase === 'awaiting_hitl';

  const config = isHitl
    ? { bg: 'bg-amber-400 hover:bg-amber-500', shadow: 'shadow-amber-300/50', icon: 'pending_actions', tooltip: 'Revision requerida - ir a la sesion', ring: 'ring-amber-300' }
    : { bg: 'bg-lime-500 hover:bg-lime-600', shadow: 'shadow-lime-300/50', icon: 'smart_toy', tooltip: currentStep || 'Agente procesando...', ring: 'ring-lime-300' };

  return (
    <button
      onClick={() => navigate(`/sesion/${sessionId}`)}
      title={config.tooltip}
      className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full ${config.bg} shadow-lg ${config.shadow} flex items-center justify-center ring-2 ${config.ring} transition-all duration-300 group`}
    >
      <span
        className={`material-symbols-outlined text-white text-3xl ${!isHitl ? 'animate-spin' : ''}`}
        style={!isHitl ? { animationDuration: '2s' } : {}}
      >
        {config.icon}
      </span>
      <span className="absolute right-16 bottom-1/2 translate-y-1/2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium px-4 py-2 rounded-lg shadow-md max-w-64 truncate">
        {config.tooltip}
      </span>
    </button>
  );
};

export default FloatingSessionIndicator;
