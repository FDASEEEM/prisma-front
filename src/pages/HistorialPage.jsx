import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainContainer from '../components/layout/MainContainer';
import { Badge, Button, Alert, Spinner } from '../components/ui';
import jobsService from '../services/jobsService';
import chatService from '../services/chatService';

const STATUS = {
  running:       { label: 'Procesando',         variant: 'info',    icon: 'autorenew',       spin: true  },
  awaiting_hitl: { label: 'Revisión pendiente',  variant: 'warning', icon: 'pending_actions',  spin: false },
  completed:     { label: 'Completado',          variant: 'success', icon: 'check_circle',    spin: false },
  degraded:      { label: 'Completado (revisar)', variant: 'warning', icon: 'warning',         spin: false },
  cancelled:     { label: 'Cancelado',           variant: 'default', icon: 'stop_circle',     spin: false },
  error:         { label: 'Error',               variant: 'error',   icon: 'error',           spin: false },
};

const resolveStatus = (phase, workflowStatus) => {
  if (phase === 'completed' && workflowStatus === 'degraded') return STATUS.degraded;
  if (phase === 'error'     && workflowStatus === 'cancelled') return STATUS.cancelled;
  return STATUS[phase] ?? STATUS.error;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const DownloadCell = ({ session }) => {
  const [downloading, setDownloading] = useState(false);

  if (session.phase !== 'completed' || !session.docxS3Key) return <span className="text-stone-400 text-sm">—</span>;

  const handleDownload = async () => {
    setDownloading(true);
    try { await chatService.downloadResult(session.sessionId); }
    catch (err) { console.error(err); }
    finally { setDownloading(false); }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={downloading} loading={downloading} icon="download">
      Descargar
    </Button>
  );
};

const HistorialPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    document.title = 'P.R.I.S.M.A. - Historial';
    jobsService.getHistory()
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainContainer title="Historial de sesiones">
      <div className="space-y-4">

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && error && (
          <Alert variant="error">{error}</Alert>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-stone-400">
            <span className="material-symbols-outlined text-5xl">history</span>
            <p className="text-sm font-medium text-stone-600">Aún no tienes sesiones generadas</p>
            <p className="text-xs">Crea una nueva sesión para comenzar</p>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                  <th className="text-left px-4 py-3 font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Prompt</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">ID de sesión</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-950">
                {sessions.map((session) => {
                  const cfg      = resolveStatus(session.phase, session.workflowStatus);
                  const canWatch = session.phase === 'running' || session.phase === 'awaiting_hitl';

                  return (
                    <tr
                      key={session.sessionId}
                      className="hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
                    >
                      {/* Fecha */}
                      <td className="px-4 py-3 whitespace-nowrap text-stone-700 dark:text-stone-300">
                        {formatDate(session.createdAt)}
                      </td>

                      {/* Prompt */}
                      <td className="px-4 py-3 max-w-xs">
                        <span className="block truncate text-stone-900 dark:text-stone-100">
                          {session.prompt?.trim() || <span className="italic text-stone-400">Sin prompt</span>}
                        </span>
                        {session.phase === 'error' && session.error && (
                          <span className="text-xs text-red-500 block truncate mt-0.5">{session.error}</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`material-symbols-outlined text-base ${cfg.spin ? 'animate-spin' : ''} ${
                              cfg.variant === 'success' ? 'text-green-500' :
                              cfg.variant === 'warning' ? 'text-amber-500' :
                              cfg.variant === 'error'   ? 'text-red-500'   :
                              cfg.variant === 'default' ? 'text-stone-500'  : 'text-lime-500'
                            }`}
                            style={cfg.spin ? { animationDuration: '2s' } : {}}
                          >
                            {cfg.icon}
                          </span>
                          <Badge variant={cfg.variant === 'default' ? undefined : cfg.variant}>
                            {cfg.label}
                          </Badge>
                        </span>
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-stone-500 dark:text-stone-400 truncate block max-w-[140px]">
                          {session.sessionId}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 justify-end">
                          {canWatch && (
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/sesion/${session.sessionId}`)}
                              icon="open_in_new"
                            >
                              Ver
                            </Button>
                          )}
                          <DownloadCell session={session} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </MainContainer>
  );
};

export default HistorialPage;
