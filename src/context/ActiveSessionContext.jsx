import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { CHAT_ENDPOINTS } from '../constants/api';

const ActiveSessionContext = createContext(null);

export const ActiveSessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const eventSourceRef = useRef(null);
  const cancelledRef = useRef(false);

  const stopTracking = useCallback(() => {
    cancelledRef.current = true;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setActiveSession(null);
  }, []);

  const startTracking = useCallback((sessionId) => {
    if (eventSourceRef.current && activeSession?.sessionId === sessionId) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    cancelledRef.current = false;
    const initial = { sessionId, phase: 'running', workflowStatus: null, currentStep: '', error: null };
    console.log('[ActiveSession] startTracking:', initial);
    setActiveSession(initial);

    const source = new EventSource(CHAT_ENDPOINTS.STREAM(sessionId));
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      if (cancelledRef.current) return;
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'ping') return;

      setActiveSession(prev => {
        if (!prev) return prev;
        switch (data.type) {
          case 'agent_start':   return { ...prev, currentStep: data.message };
          case 'agent_end':     return { ...prev, currentStep: '' };
          case 'hitl_required': return { ...prev, phase: 'awaiting_hitl', currentStep: '' };
          case 'completed':
            source.close(); eventSourceRef.current = null;
            return { ...prev, phase: 'completed', workflowStatus: data.workflow_status, currentStep: '' };
          case 'error':
            source.close(); eventSourceRef.current = null;
            return { ...prev, phase: 'error', error: data.message, currentStep: '' };
          default: return prev;
        }
      });
    };

    source.onerror = () => {
      if (cancelledRef.current) return;
      source.close();
      eventSourceRef.current = null;
    };
  }, [activeSession?.sessionId]);

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
