import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { CHAT_ENDPOINTS } from '../constants/api';
import storageUtils from '../utils/localStorage';

const ActiveSessionContext = createContext(null);
const STORAGE_KEY = 'prisma_active_session';

const save = (session) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch {}
};

export const ActiveSessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session?.sessionId && session?.phase) return session;
      }
    } catch {}
    return null;
  });

  const eventSourceRef = useRef(null);
  const cancelledRef = useRef(false);
  const trackedIdRef = useRef(activeSession?.sessionId ?? null);

  const stopTracking = useCallback(() => {
    cancelledRef.current = true;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    trackedIdRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
    setActiveSession(null);
  }, []);

  const connectSSE = useCallback((sessionId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    cancelledRef.current = false;

    const token = storageUtils.getToken();
    const base = CHAT_ENDPOINTS.STREAM(sessionId);
    const url = token ? `${base}?token=${encodeURIComponent(token)}` : base;
    const source = new EventSource(url);
    eventSourceRef.current = source;

    source.onmessage = (e) => {
      if (cancelledRef.current) return;
      let data;
      try { data = JSON.parse(e.data); } catch { return; }
      if (data.type === 'ping') return;

      setActiveSession(prev => {
        if (!prev) return prev;
        let next = prev;
        switch (data.type) {
          case 'agent_start':
            next = { ...prev, phase: 'running', currentStep: data.message };
            break;
          case 'agent_end':
            next = { ...prev, currentStep: '' };
            break;
          case 'hitl_required':
            next = { ...prev, phase: 'awaiting_hitl', currentStep: '' };
            break;
          case 'completed':
            source.close(); eventSourceRef.current = null;
            next = { ...prev, phase: 'completed', workflowStatus: data.workflow_status, currentStep: '' };
            break;
          case 'error':
            source.close(); eventSourceRef.current = null;
            next = { ...prev, phase: 'error', error: data.message, currentStep: '' };
            break;
        }
        save(next);
        return next;
      });
    };

    source.onerror = () => {
      if (cancelledRef.current) return;
      source.close();
      eventSourceRef.current = null;
    };
  }, []);

  const startTracking = useCallback((sessionId) => {
    if (trackedIdRef.current === sessionId && eventSourceRef.current) return;
    trackedIdRef.current = sessionId;
    const initial = { sessionId, phase: 'running', workflowStatus: null, currentStep: '', error: null };
    save(initial);
    setActiveSession(initial);
    connectSSE(sessionId);
  }, [connectSSE]);

  // Al restaurar desde localStorage: reconectar SSE si estaba en running
  useEffect(() => {
    const restored = activeSession;
    if (restored?.phase === 'running' && restored?.sessionId && !eventSourceRef.current) {
      trackedIdRef.current = restored.sessionId;
      connectSSE(restored.sessionId);
    }
  }, []); // solo en mount

  return (
    <ActiveSessionContext.Provider value={{ activeSession, startTracking, stopTracking }}>
      {children}
    </ActiveSessionContext.Provider>
  );
};

export const useActiveSession = () => {
  const ctx = useContext(ActiveSessionContext);
  if (!ctx) throw new Error('useActiveSession must be used inside ActiveSessionProvider');
  return ctx;
};
