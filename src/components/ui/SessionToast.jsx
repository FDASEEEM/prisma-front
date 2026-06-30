import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveSession } from '../../context/ActiveSessionContext';
import chatService from '../../services/chatService';

const ERROR_TOAST_DURATION = 12000;

const SessionToast = () => {
  const { activeSession, stopTracking } = useActiveSession();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);

  const isTerminal = activeSession?.phase === 'completed' || activeSession?.phase === 'error';
  const isSuccess = activeSession?.phase === 'completed';
  // Un bloqueo normativo es un estado terminal "error" pero NO un fallo del sistema:
  // se presenta de forma distinta (no rojo de error genérico).
  const isComplianceBlock = activeSession?.workflowStatus === 'compliance_blocked';

  // Handlers declarados ANTES de los efectos que los referencian (evita el TDZ
  // ReferenceError al auto-cerrar el toast).
  const handleDismiss = useCallback(() => {
    setVisible(false);
    stopTracking();
  }, [stopTracking]);

  const handleGoToSession = () => {
    navigate(`/sesion/${activeSession.sessionId}`);
    handleDismiss();
  };

  const handleDownload = async () => {
    try {
      await chatService.downloadResult(activeSession.sessionId);
    } catch (err) {
      console.error('Error al descargar:', err);
    }
  };

  useEffect(() => {
    if (isTerminal) setVisible(true);
  }, [isTerminal]);

  // Mostrar inmediatamente si se restauró un estado terminal desde localStorage
  useEffect(() => {
    if (isTerminal) setVisible(true);
  }, []);

  // Auto-dismiss solo para errores — los completados quedan hasta que el profesor los visite
  useEffect(() => {
    if (!visible || isSuccess) return;
    setProgress(100);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / ERROR_TOAST_DURATION) * 100);
      setProgress(remaining);
      if (remaining === 0) { clearInterval(interval); handleDismiss(); }
    }, 50);
    return () => clearInterval(interval);
  }, [visible, isSuccess, handleDismiss]);

  if (!visible || !activeSession) return null;

  // Paleta: éxito = lima, bloqueo normativo = naranja, error de sistema = rojo.
  const accent = isSuccess
    ? { border: 'border-lime-200 dark:border-lime-800', bar: 'bg-lime-400', icon: 'text-lime-500', body: '' }
    : isComplianceBlock
      ? { border: 'border-orange-200 dark:border-orange-800', bar: 'bg-orange-400', icon: 'text-orange-500', body: 'text-orange-700 dark:text-orange-400' }
      : { border: 'border-red-200 dark:border-red-800', bar: 'bg-red-400', icon: 'text-red-500', body: 'text-red-600 dark:text-red-400' };

  const title = isSuccess
    ? 'Tu material se ha generado'
    : isComplianceBlock
      ? 'Documento no conforme a normativa'
      : 'Error en la generación';

  const iconName = isSuccess ? 'check_circle' : isComplianceBlock ? 'gavel' : 'error';

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-stone-900 border ${accent.border}`}>
      <div className="h-1 w-full bg-stone-100 dark:bg-stone-800">
        <div className={`h-full transition-none ${accent.bar}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-xl ${accent.icon}`}>
              {iconName}
            </span>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              {title}
            </p>
          </div>
          <button onClick={handleDismiss} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        {!isSuccess && activeSession.error && (
          <p className={`text-xs mb-3 leading-relaxed ${accent.body}`}>{activeSession.error}</p>
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
