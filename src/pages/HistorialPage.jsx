import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainContainer from '../components/layout/MainContainer';
import { Card, Badge, Button, Alert, Spinner } from '../components/ui';
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
      <div className="space-y-8">

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && error && (
          <Alert variant="error">{error}</Alert>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
            <span className="material-symbols-outlined text-5xl">history</span>
            <p className="text-sm font-medium text-gray-600">Aún no tienes sesiones generadas</p>
            <p className="text-xs">Crea una nueva sesión para comenzar</p>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-headline">
              Sesiones generadas
            </h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Fecha</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Prompt</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">Estado</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 whitespace-nowrap">ID de sesión</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => {
                      const cfg      = resolveStatus(session.phase, session.workflowStatus);
                      const canWatch = session.phase === 'running' || session.phase === 'awaiting_hitl';

                      return (
                        <tr
                          key={session.sessionId}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          {/* Fecha */}
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(session.createdAt)}
                          </td>

                          {/* Prompt */}
                          <td className="py-3 px-4 max-w-xs">
                            <span className="block truncate font-semibold text-gray-900">
                              {session.prompt?.trim() || <span className="italic text-gray-400 font-normal">Sin prompt</span>}
                            </span>
                            {session.phase === 'error' && session.error && (
                              <span className="text-xs text-red-500 block truncate mt-0.5">{session.error}</span>
                            )}
                          </td>

                          {/* Estado */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={`material-symbols-outlined text-base ${cfg.spin ? 'animate-spin' : ''} ${
                                  cfg.variant === 'success' ? 'text-green-500' :
                                  cfg.variant === 'warning' ? 'text-amber-500' :
                                  cfg.variant === 'error'   ? 'text-red-500'   :
                                  cfg.variant === 'default' ? 'text-gray-500'  : 'text-blue-500'
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
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs text-gray-600 truncate block max-w-[140px]">
                              {session.sessionId}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 whitespace-nowrap text-right">
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
            </Card>
          </div>
        )}

      </div>
    </MainContainer>
  );
};

export default HistorialPage;
