import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainContainer from '../components/layout/MainContainer';
import chatService from '../services/chatService';
import { CHAT_ENDPOINTS } from '../constants/api';
import storageUtils from '../utils/localStorage';

// ── MessageBubble ────────────────────────────────────────────────────────────

const MessageBubble = ({ role, content }) => {
  const isAgent = role === 'agent';
  return (
    <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
        isAgent
          ? 'bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200 rounded-tl-sm'
          : 'bg-lime-50 dark:bg-lime-950/30 text-lime-900 dark:text-lime-100 rounded-tr-sm'
      }`}>
        {content}
      </div>
    </div>
  );
};

// ── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
);

// ── HitlAccordion ────────────────────────────────────────────────────────────

const HitlAccordion = ({ title, content }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-amber-200 dark:border-amber-800 rounded-xl mb-2 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-4 py-2.5 flex justify-between items-center text-sm font-medium text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
      >
        {title}
        <span className="material-symbols-outlined text-base">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap max-h-52 overflow-y-auto bg-white dark:bg-stone-900 border-t border-amber-100 dark:border-amber-800">
          {content || '(sin datos)'}
        </div>
      )}
    </div>
  );
};

// ── HitlCard ─────────────────────────────────────────────────────────────────

const HitlCard = ({ hitlData, onRespond }) => {
  const [approved, setApproved] = useState(null);
  const [reason, setReason] = useState('');
  const [agentToRetry, setAgentToRetry] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    approved === true || (approved === false && reason.trim() && agentToRetry !== null);

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onRespond({
      approved,
      reason: approved ? null : reason,
      agent_to_retry: approved ? null : agentToRetry,
    });
  };

  return (
    <div className="border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 my-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">warning</span>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Revisión requerida — intento {hitlData.attempt} de {hitlData.max_attempts}
        </p>
      </div>

      <HitlAccordion title="📋 Análisis PACI (Agente 1)" content={hitlData.perfil_paci} />
      <HitlAccordion title="📝 Planificación Adaptada (Agente 2)" content={hitlData.planificacion_adaptada} />

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => { setApproved(true); setAgentToRetry(null); setReason(''); }}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
            approved === true
              ? 'bg-lime-600 text-white border-lime-600'
              : 'bg-white dark:bg-stone-900 text-lime-700 dark:text-lime-400 border-lime-400 hover:bg-lime-50 dark:hover:bg-lime-950/20'
          }`}
        >
          Aprobar
        </button>
        <button
          onClick={() => setApproved(false)}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
            approved === false
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white dark:bg-stone-900 text-red-500 border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
          }`}
        >
          Rechazar
        </button>
      </div>

      {approved === false && (
        <div className="mt-3 space-y-2">
          <textarea
            className="w-full border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
            rows={2}
            placeholder="Describe el problema encontrado (requerido)"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <p className="text-xs font-medium text-stone-600 dark:text-stone-400">¿Qué se debe corregir?</p>
          <div className="flex gap-2">
            {[
              { id: 1, label: 'Análisis del PACI' },
              { id: 2, label: 'Adaptación del material' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setAgentToRetry(id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  agentToRetry === id
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {approved !== null && (
        <button
          onClick={handleConfirm}
          disabled={!canSubmit || submitting}
          className="w-full mt-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold py-2.5 rounded-xl hover:bg-stone-700 dark:hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
        >
          {submitting ? 'Enviando...' : 'Confirmar'}
        </button>
      )}
    </div>
  );
};

// ── Phase config ─────────────────────────────────────────────────────────────

const PHASE_CONFIG = {
  running:            { label: 'Procesando',               badge: 'text-lime-700 bg-lime-100 dark:text-lime-400 dark:bg-lime-950/40',    icon: 'autorenew' },
  awaiting_hitl:      { label: 'Esperando revisión',       badge: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40', icon: 'pending_actions' },
  completed:          { label: 'Completado',               badge: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950/40', icon: 'check_circle' },
  completed_degraded: { label: 'Completado con advertencia', badge: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40', icon: 'warning' },
  error_hitl_rejected:{ label: 'Cancelado',                badge: 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40',    icon: 'cancel' },
  error:              { label: 'Error',                    badge: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/40',        icon: 'error' },
};

// ── SesionPage ───────────────────────────────────────────────────────────────

const SesionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { startTracking } = useActiveSession();

  const [phase, setPhase] = useState('running');
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hitlData, setHitlData] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('');
  const bottomRef = useRef(null);
  const eventSourceRef = useRef(null);

  // ── Manejador de eventos SSE ──────────────────────────────────────────────
  const handleSSEEvent = useCallback((event) => {
    // Guard: el servidor puede enviar pings vacíos o payloads malformados
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    if (data.type === 'ping') return;

    switch (data.type) {
      case 'agent_start':
        setCurrentStep(data.message);
        break;

      case 'agent_end':
        setCurrentStep('');
        break;

      case 'message':
        setMessages(prev => [...prev, { role: data.role, content: data.content }]);
        break;

      case 'hitl_required':
        setHitlData(data.hitl_data);
        setPhase('awaiting_hitl');
        break;

      case 'completed':
        setPhase('completed');
        setWorkflowStatus(data.workflow_status);
        setCurrentStep('');
        break;

      case 'error':
        setPhase('error');
        setError(data.message);
        setCurrentStep('');
        break;

      default:
        console.warn('Evento SSE desconocido:', data.type);
    }
  }, []);

  // ── Conectar a SSE ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Sync de estado puntual — se usa en hidratación y como fallback si el stream cierra
    const syncState = async () => {
      try {
        const state = await chatService.getSessionState(sessionId);
        if (cancelled) return;
        setMessages(state.messages || []);
        if (state.hitl_data) setHitlData(state.hitl_data);
        if (state.error) setError(state.error);
        setWorkflowStatus(state.workflow_status || null);
        setPhase(state.phase);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setPhase('error');
      }
    };

    const connectToSSE = () => {
      const token = storageUtils.getToken();
      const base = CHAT_ENDPOINTS.STREAM(sessionId);
      const url = token ? `${base}?token=${encodeURIComponent(token)}` : base;
      const source = new EventSource(url);
      eventSourceRef.current = source;

      source.onmessage = handleSSEEvent;

      source.onerror = () => {
        // El stream cerró inesperadamente — sincronizar estado una vez, sin reconectar
        // El backend cierra limpiamente en eventos terminales; si cerró por error de red,
        // el GET /state devuelve el estado actual y el usuario puede refrescar si necesita.
        source.close();
        eventSourceRef.current = null;
        if (!cancelled) syncState();
      };
    };

    // Hidratación inicial: leer estado actual, luego conectar SSE si no está terminado
    const hydrate = async () => {
      try {
        const state = await chatService.getSessionState(sessionId);
        if (cancelled) return;

        setMessages(state.messages || []);
        if (state.hitl_data) setHitlData(state.hitl_data);
        if (state.error) setError(state.error);
        setWorkflowStatus(state.workflow_status || null);
        setPhase(state.phase);

        // No conectar SSE si la sesión ya terminó
        if (state.phase === 'completed' || state.phase === 'error') return;

        // Registrar en contexto global (soporte para page refresh)
        startTracking(sessionId);

        connectToSSE();
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setPhase('error');
      }
    };

    hydrate();

    return () => {
      cancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [sessionId, handleSSEEvent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, hitlData, phase]);

  const handleHitlRespond = async (response) => {
    await chatService.sendHitlDecision(
      sessionId,
      response.approved,
      response.reason,
      response.agent_to_retry,
    );
    setHitlData(null);
    setPhase('running');
  };

  const phaseKey =
    phase === 'completed' && workflowStatus === 'degraded' ? 'completed_degraded' :
    phase === 'error'     && workflowStatus === 'hitl_rejected' ? 'error_hitl_rejected' :
    phase;
  const phaseConf = PHASE_CONFIG[phaseKey] || PHASE_CONFIG.running;

  return (
    <MainContainer title="Sesión en curso">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        {/* Session header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-stone-400 mb-0.5">ID de sesión</p>
            <p className="font-mono text-sm text-stone-600 dark:text-stone-300 break-all">{sessionId}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${phaseConf.badge}`}>
              <span className={`material-symbols-outlined text-sm ${phase === 'running' ? 'animate-spin' : ''}`}>
                {phaseConf.icon}
              </span>
              {phaseConf.label}
            </span>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Escritorio
            </button>
          </div>
        </div>

        {/* Chat card */}
        <div className="bg-stone-50 dark:bg-stone-950 rounded-3xl shadow-sm overflow-hidden">
          <div
            className="overflow-y-auto px-6 py-6"
            style={{ minHeight: '55vh', maxHeight: 'calc(100vh - 260px)' }}
          >
            {messages.length === 0 && phase === 'running' && (
              <p className="text-stone-400 text-sm text-center mt-12">Iniciando procesamiento...</p>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} role={msg.role} content={msg.content} />
            ))}

            {phase === 'awaiting_hitl' && hitlData && (
              <HitlCard hitlData={hitlData} onRespond={handleHitlRespond} />
            )}

            {phase === 'running' && (
              <div className="flex items-center gap-2 text-stone-400 text-sm pt-2 pl-1">
                <Spinner />
                <span>{currentStep || 'El agente está procesando...'}</span>
              </div>
            )}

            {phase === 'completed' && workflowStatus === 'success' && (
              <div className="flex flex-col items-center gap-3 py-8">
                <span className="material-symbols-outlined text-5xl text-lime-500">check_circle</span>
                <p className="text-green-700 dark:text-green-400 text-sm text-center font-medium">
                  Rúbrica generada y validada por el evaluador interno.
                </p>
                <a
                  href={CHAT_ENDPOINTS.DOWNLOAD(sessionId)}
                  download
                  className="inline-flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white font-semibold px-8 py-3 rounded-2xl transition-colors text-sm shadow-sm mt-1"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Descargar PACI Adaptado (.docx)
                </a>
              </div>
            )}

            {phase === 'completed' && workflowStatus === 'degraded' && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300 w-full flex items-start gap-2">
                  <span className="material-symbols-outlined text-base flex-shrink-0">warning</span>
                  <span>
                    La rúbrica fue generada como mejor esfuerzo pero no superó todos los criterios
                    de calidad del evaluador.{' '}
                    <strong>Revise el documento antes de usarlo.</strong>
                  </span>
                </div>
                <a
                  href={CHAT_ENDPOINTS.DOWNLOAD(sessionId)}
                  download
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-2xl transition-colors text-sm shadow-sm mt-1"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Descargar PACI Adaptado (.docx)
                </a>
              </div>
            )}

            {phase === 'error' && workflowStatus === 'hitl_rejected' && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-800 dark:text-blue-300 mt-2">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">cancel</span>
                  Proceso cancelado
                </p>
                <p>
                  El análisis inicial no obtuvo aprobación del docente luego de 3 intentos.
                  Puede iniciar un nuevo proceso con los documentos corregidos.
                </p>
                <button
                  onClick={() => navigate('/nueva-sesion')}
                  className="mt-3 text-xs font-semibold text-blue-700 dark:text-blue-400 underline hover:text-blue-900 dark:hover:text-blue-200"
                >
                  Iniciar nuevo proceso
                </button>
              </div>
            )}

            {phase === 'error' && workflowStatus !== 'hitl_rejected' && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-sm text-red-700 dark:text-red-400 mt-2">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">error</span>
                  Error durante el procesamiento
                </p>
                <p>{error || 'Ocurrió un error inesperado. Intente nuevamente.'}</p>
                <button
                  onClick={() => navigate('/nueva-sesion')}
                  className="mt-3 text-xs font-semibold text-red-700 dark:text-red-400 underline hover:text-red-900 dark:hover:text-red-200"
                >
                  Iniciar nuevo proceso
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

      </div>
    </MainContainer>
  );
};

export default SesionPage;
