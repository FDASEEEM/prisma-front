import { useState, useEffect } from 'react';
import MainContainer from '../components/layout/MainContainer';
import { useAuth } from '../context/AuthContext';
import adminPanelService from '../services/adminPanelService';
import { Button, Input } from '../components/ui';

const PANEL = 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl';
const H2    = 'text-base font-bold text-stone-900 dark:text-stone-50';
const BODY  = 'text-sm text-stone-900 dark:text-stone-100 leading-relaxed';

const SoportePage = () => {
  const { user } = useAuth();
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  const [ticketBusy, setTicketBusy] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [myTickets, setMyTickets] = useState([]);
  const [myTicketsLoading, setMyTicketsLoading] = useState(false);

  const loadMyTickets = async () => {
    if (!user?.id) return;
    setMyTicketsLoading(true);
    try {
      const data = await adminPanelService.getTicketsByRequester(user.id);
      setMyTickets(data || []);
    } catch {
      setMyTickets([]);
    } finally {
      setMyTicketsLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'P.R.I.S.M.A. - Soporte';
    loadMyTickets();
  }, [user?.id]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) return;
    setTicketBusy(true);
    setTicketError('');
    setTicketSuccess(false);
    try {
      await adminPanelService.createTicket({
        requesterId: user?.id || 'unknown',
        subject: ticketForm.subject,
        message: ticketForm.message,
      });
      setTicketSuccess(true);
      setTicketForm({ subject: '', message: '' });
      loadMyTickets();
    } catch (err) {
      setTicketError(err.message || 'No se pudo enviar el ticket');
    } finally {
      setTicketBusy(false);
    }
  };

  return (
    <MainContainer title="Soporte">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Mis Tickets */}
        <div className={`${PANEL} p-5`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-stone-500">inbox</span>
            <h2 className={`${H2}`}>Mis Tickets</h2>
          </div>
          {myTicketsLoading ? (
            <p className={`${BODY} text-stone-500`}>Cargando...</p>
          ) : myTickets.length === 0 ? (
            <p className={`${BODY} text-stone-500`}>No has enviado tickets aún.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {myTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">{ticket.subject}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{ticket.status === 'open' ? 'Abierto' : ticket.status === 'in_progress' ? 'En proceso' : 'Cerrado'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {ticket.status === 'open' ? 'ABIERTO' : ticket.status === 'in_progress' ? 'EN PROCESO' : 'CERRADO'}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700 dark:text-stone-200 mt-2">{ticket.message}</p>
                  {ticket.replies?.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-lime-200 pl-3">
                      {ticket.replies.map((reply) => (
                        <div key={reply.id} className="bg-stone-50 dark:bg-stone-800 rounded-lg px-3 py-2 text-sm">
                          <p className="text-stone-700 dark:text-stone-200">{reply.message}</p>
                          <p className="text-[10px] text-stone-400 mt-1">{new Date(reply.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-stone-400 mt-2">{new Date(ticket.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crear Ticket */}
        <div className={`${PANEL} p-5`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-stone-500">support_agent</span>
            <h2 className={`${H2}`}>Nuevo Ticket</h2>
          </div>
          <p className={`${BODY} mb-4`}>
            ¿Tienes un problema o necesitas ayuda? Envía un ticket al equipo de administración.
          </p>
          {ticketSuccess && (
            <div className="mb-4 rounded-xl bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-800 px-4 py-3 text-sm text-lime-800 dark:text-lime-300">
              <span className="font-bold">Ticket enviado correctamente.</span> El equipo de administración lo revisará pronto.
            </div>
          )}
          {ticketError && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {ticketError}
            </div>
          )}
          <form onSubmit={handleCreateTicket} className="space-y-3">
            <Input
              label="Asunto"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Ej: Error al generar PDF"
              required
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Mensaje</label>
              <textarea
                value={ticketForm.message}
                onChange={(e) => setTicketForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Describe tu problema con el mayor detalle posible..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                required
              />
            </div>
            <Button type="submit" disabled={ticketBusy || !ticketForm.subject.trim() || !ticketForm.message.trim()}>
              {ticketBusy ? 'Enviando...' : 'Enviar ticket'}
            </Button>
          </form>
        </div>

      </div>
    </MainContainer>
  );
};

export default SoportePage;
