import { useEffect, useMemo, useState } from 'react';
import MainContainer from '../components/layout/MainContainer';
import { Alert, Badge, Button, Card, Input, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import adminPanelService from '../services/adminPanelService';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'resources', label: 'Recursos' },
  { key: 'announcements', label: 'Anuncios' },
  { key: 'professors', label: 'Profesores' },
  { key: 'sessions', label: 'Sesiones' },
  { key: 'audit', label: 'Auditoría' },
];

const emptyResourceForm = { title: '', description: '', type: 'document', url: '', uploadedBy: '' };
const emptyAnnouncementForm = { title: '', body: '', audience: 'all', startsAt: '', endsAt: '', createdBy: '' };
const emptyProfessorForm = { userId: '', nombreCompleto: '', email: '', password: '', role: 'TEACHER', especialidad: '', telefono: '' };

const StatusBadge = ({ status }) => {
  const variant = status === 'closed' ? 'success' : status === 'in_progress' ? 'warning' : 'info';
  return <Badge variant={variant}>{status}</Badge>;
};

const TabButton = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

const DateTimeInput = ({ label, value, onChange, hint }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="datetime-local"
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
    />
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const SelectInput = ({ label, value, onChange, options }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>Confirmar</Button>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className={`fixed top-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg ${bg}`}>
      {message}
    </div>
  );
};

const AdminPanelPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [historicalSessions, setHistoricalSessions] = useState([]);
  const [blockedSessions, setBlockedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [resourceForm, setResourceForm] = useState(emptyResourceForm);
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncementForm);
  const [professorForm, setProfessorForm] = useState(emptyProfessorForm);
  const [editingResource, setEditingResource] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingProfessor, setEditingProfessor] = useState(null);

  useEffect(() => {
    document.title = 'P.R.I.S.M.A. - Admin Panel';
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        adminPanelService.getSummary(),
        adminPanelService.getTickets(),
        adminPanelService.getResources(),
        adminPanelService.getAnnouncements(),
        adminPanelService.getAuditLogs(),
        adminPanelService.getProfessors(),
        adminPanelService.getActiveSessions(),
        adminPanelService.getHistoricalSessions(),
        adminPanelService.getBlockedSessions(),
      ]);

      const extractData = (result) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          return Array.isArray(data) ? data : data?.items || [];
        }
        return [];
      };

      setSummary(results[0].status === 'fulfilled' ? results[0].value : null);
      setTickets(extractData(results[1]));
      setResources(extractData(results[2]));
      setAnnouncements(extractData(results[3]));
      setAuditLogs(extractData(results[4]));
      setProfessors(extractData(results[5]));
      setActiveSessions(extractData(results[6]));
      setHistoricalSessions(extractData(results[7]));
      setBlockedSessions(extractData(results[8]));

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`${failures.length} endpoint(s) failed to load`);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar el panel de administración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = useMemo(() => summary?.kpis || {}, [summary]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleCreateResource = async (event) => {
    event.preventDefault();
    try {
      setBusy(true);
      await adminPanelService.createResource(resourceForm);
      setResourceForm(emptyResourceForm);
      await loadData();
      showToast('Recurso creado correctamente');
    } catch (err) {
      showToast(err.message || 'No se pudo crear el recurso', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateResource = async (id) => {
    try {
      setBusy(true);
      await adminPanelService.updateResource(id, editingResource);
      setEditingResource(null);
      await loadData();
      showToast('Recurso actualizado correctamente');
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el recurso', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();
    if (!announcementForm.createdBy.trim()) {
      showToast('El campo "Publicado por" es obligatorio', 'error');
      return;
    }
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
      showToast('Título y cuerpo son obligatorios', 'error');
      return;
    }
    try {
      setBusy(true);
      const startsAtDate = announcementForm.startsAt ? new Date(announcementForm.startsAt) : null;
      const endsAtDate = announcementForm.endsAt ? new Date(announcementForm.endsAt) : null;
      if (startsAtDate && isNaN(startsAtDate.getTime())) {
        showToast('Fecha de inicio inválida', 'error');
        return;
      }
      if (endsAtDate && isNaN(endsAtDate.getTime())) {
        showToast('Fecha de fin inválida', 'error');
        return;
      }
      const payload = {
        title: announcementForm.title,
        body: announcementForm.body,
        audience: announcementForm.audience,
        createdBy: announcementForm.createdBy,
        ...(startsAtDate ? { startsAt: startsAtDate.toISOString() } : {}),
        ...(endsAtDate ? { endsAt: endsAtDate.toISOString() } : {}),
      };
      console.log('Creando anuncio con payload:', payload);
      const result = await adminPanelService.createAnnouncement(payload);
      console.log('Anuncio creado:', result);
      setAnnouncements((prev) => [result.data || result, ...prev]);
      setAnnouncementForm(emptyAnnouncementForm);
      showToast('Anuncio creado correctamente');
    } catch (err) {
      console.error('Error creando anuncio:', err);
      showToast(err.message || 'No se pudo crear el anuncio', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateAnnouncement = async (id) => {
    try {
      setBusy(true);
      const payload = {
        ...editingAnnouncement,
        startsAt: editingAnnouncement.startsAt ? new Date(editingAnnouncement.startsAt).toISOString() : undefined,
        endsAt: editingAnnouncement.endsAt ? new Date(editingAnnouncement.endsAt).toISOString() : undefined,
      };
      await adminPanelService.updateAnnouncement(id, payload);
      setEditingAnnouncement(null);
      await loadData();
      showToast('Anuncio actualizado correctamente');
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el anuncio', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateProfessor = async (event) => {
    event.preventDefault();
    try {
      setBusy(true);
      await adminPanelService.createProfessor(professorForm);
      setProfessorForm(emptyProfessorForm);
      await loadData();
      showToast('Profesor creado correctamente');
    } catch (err) {
      showToast(err.message || 'No se pudo crear el profesor', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateProfessor = async (id) => {
    try {
      setBusy(true);
      await adminPanelService.updateProfessor(id, editingProfessor);
      setEditingProfessor(null);
      await loadData();
      showToast('Profesor actualizado correctamente');
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el profesor', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleTicketStatus = async (id, status) => {
    try {
      setBusy(true);
      await adminPanelService.updateTicket(id, { status });
      await loadData();
      showToast(`Ticket ${status === 'open' ? 'abierto' : status === 'in_progress' ? 'en proceso' : 'cerrado'}`);
    } catch (err) {
      showToast(err.message || 'No se pudo actualizar el ticket', 'error');
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (type, id, name) => setConfirmDelete({ type, id, name });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    try {
      setBusy(true);
      if (type === 'ticket') await adminPanelService.deleteTicket(id);
      if (type === 'resource') await adminPanelService.deleteResource(id);
      if (type === 'announcement') await adminPanelService.deleteAnnouncement(id);
      if (type === 'professor') await adminPanelService.deleteProfessor(id);
      await loadData();
      showToast('Eliminado correctamente');
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar', 'error');
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  };

  const handleSessionAction = async (action, id) => {
    try {
      setBusy(true);
      if (action === 'block') await adminPanelService.blockSession(id);
      if (action === 'unblock') await adminPanelService.unblockSession(id);
      if (action === 'terminate') await adminPanelService.terminateSession(id);
      await loadData();
      showToast(action === 'block' ? 'Sesión bloqueada' : action === 'unblock' ? 'Sesión desbloqueada' : 'Sesión terminada');
    } catch (err) {
      showToast(err.message || 'No se pudo ejecutar la acción', 'error');
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('es-CL');
  };

  const formatForInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <MainContainer title="Admin Panel">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </MainContainer>
    );
  }

  return (
    <MainContainer title="Admin Panel">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar "${confirmDelete?.name || 'este registro'}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="space-y-6">
        <div className="pt-4 flex flex-col gap-3">
          <Badge variant="warning">Acceso restringido</Badge>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 font-headline">Panel de Administración</h1>
            <p className="mt-2 text-gray-600 font-body">
              {user?.nombreCompleto ? `Sesión iniciada como ${user.nombreCompleto}.` : 'Vista principal del administrador.'}
            </p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {TABS.map((tab) => (
            <TabButton key={tab.key} active={activeTab === tab.key} label={tab.label} onClick={() => setActiveTab(tab.key)} />
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                { title: 'Tickets abiertos', value: kpis.openTickets ?? 0 },
                { title: 'Anuncios publicados', value: kpis.publishedAnnouncements ?? 0 },
                { title: 'Recursos cargados', value: kpis.totalResources ?? 0 },
                { title: 'Profesores activos', value: kpis.activeProfessors ?? 0 },
                { title: 'Sesiones activas', value: kpis.activeSessions ?? 0 },
              ].map((item) => (
                <Card key={item.title}>
                  <div className="p-5">
                    <div className="text-sm text-gray-500">{item.title}</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{item.value}</div>
                  </div>
                </Card>
              ))}
            </div>

            <Card>
              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tickets Recientes</h2>
                <div className="space-y-2">
                  {(summary?.recentTickets || []).length ? summary.recentTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <div className="font-medium text-gray-900">{ticket.subject}</div>
                        <div className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</div>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>
                  )) : <div className="text-sm text-gray-500">No hay tickets recientes.</div>}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'tickets' && (
          <Card>
            <div className="p-5 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 font-headline">Tickets ({tickets.length})</h2>
              <p className="text-sm text-gray-500">Los tickets son creados por los docentes desde su escritorio. Aquí puedes verlos, cambiar su estado o eliminarlos.</p>
              <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
                {tickets.length ? tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{ticket.subject}</div>
                        <div className="text-sm text-gray-500">{ticket.requesterId}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleTicketStatus(ticket.id, e.target.value)}
                          disabled={busy}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none pr-6 relative
                            ${ticket.status === 'open'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 focus:ring-blue-300'
                              : ticket.status === 'in_progress'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 focus:ring-amber-300'
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 focus:ring-green-300'
                            } disabled:opacity-50`}
                          style={{ backgroundImage: 'none' }}
                        >
                          <option value="open">Abierto</option>
                          <option value="in_progress">En proceso</option>
                          <option value="closed">Cerrado</option>
                        </select>
                        <button
                          onClick={() => requestDelete('ticket', ticket.id, ticket.subject)}
                          disabled={busy}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                          title="Eliminar ticket"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{ticket.message}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatDate(ticket.createdAt)}
                    </div>
                  </div>
                )) : <div className="text-sm text-gray-500">No hay tickets registrados.</div>}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'resources' && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Crear Recurso</h2>
                <form onSubmit={handleCreateResource} className="space-y-3">
                  <Input label="Título" value={resourceForm.title} onChange={(e) => setResourceForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Nombre del material" />
                  <Input label="Descripción" value={resourceForm.description} onChange={(e) => setResourceForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Breve descripción (opcional)" />
                  <SelectInput label="Tipo" value={resourceForm.type} onChange={(e) => setResourceForm((prev) => ({ ...prev, type: e.target.value }))} options={[
                    { value: 'file', label: 'Archivo' },
                    { value: 'link', label: 'Enlace' },
                    { value: 'video', label: 'Video' },
                    { value: 'document', label: 'Documento' },
                  ]} />
                  <Input label="URL" value={resourceForm.url} onChange={(e) => setResourceForm((prev) => ({ ...prev, url: e.target.value }))} placeholder="https://..." />
                  <Input label="Subido por" value={resourceForm.uploadedBy} onChange={(e) => setResourceForm((prev) => ({ ...prev, uploadedBy: e.target.value }))} placeholder="ID del admin" />
                  <Button type="submit" disabled={busy}>{busy ? 'Creando...' : 'Crear recurso'}</Button>
                </form>
              </div>
            </Card>

            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Recursos ({resources.length})</h2>
                <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
                  {resources.length ? resources.map((resource) => (
                    <div key={resource.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                      {editingResource?.id === resource.id ? (
                        <div className="space-y-2">
                          <Input label="Título" value={editingResource.title} onChange={(e) => setEditingResource((prev) => ({ ...prev, title: e.target.value }))} />
                          <Input label="URL" value={editingResource.url} onChange={(e) => setEditingResource((prev) => ({ ...prev, url: e.target.value }))} />
                          <div className="flex gap-2">
                            <Button onClick={() => handleUpdateResource(resource.id)} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</Button>
                            <Button variant="outline" onClick={() => setEditingResource(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{resource.title}</div>
                              <div className="text-sm text-gray-500 capitalize">{resource.type}</div>
                            </div>
                            <Badge variant="info">{resource.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 break-all">{resource.url}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEditingResource({ id: resource.id, title: resource.title, url: resource.url })}>Editar</Button>
                            <Button variant="danger" onClick={() => requestDelete('resource', resource.id, resource.title)} disabled={busy}>Eliminar</Button>
                          </div>
                        </>
                      )}
                    </div>
                  )) : <div className="text-sm text-gray-500">No hay recursos cargados.</div>}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Crear Anuncio</h2>
                <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                  <Input label="Título" value={announcementForm.title} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Título del anuncio" />
                  <Input label="Cuerpo" value={announcementForm.body} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, body: e.target.value }))} placeholder="Contenido del anuncio" />
                  <SelectInput label="Audiencia" value={announcementForm.audience} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, audience: e.target.value }))} options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'teachers', label: 'Solo profesores' },
                    { value: 'admins', label: 'Solo administradores' },
                  ]} />
                  <Input label="Publicado por" value={announcementForm.createdBy} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, createdBy: e.target.value }))} placeholder="ID del admin" />
                  <DateTimeInput label="Fecha de inicio" value={announcementForm.startsAt} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, startsAt: e.target.value }))} hint="Cuándo se publica (opcional)" />
                  <DateTimeInput label="Fecha de fin" value={announcementForm.endsAt} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, endsAt: e.target.value }))} hint="Cuándo se oculta (opcional)" />
                  <Button type="submit" disabled={busy}>{busy ? 'Creando...' : 'Crear anuncio'}</Button>
                </form>
              </div>
            </Card>

            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Anuncios ({announcements.length})</h2>
                <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
                  {announcements.length ? announcements.map((announcement) => (
                    <div key={announcement.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                      {editingAnnouncement?.id === announcement.id ? (
                        <div className="space-y-2">
                          <Input label="Título" value={editingAnnouncement.title} onChange={(e) => setEditingAnnouncement((prev) => ({ ...prev, title: e.target.value }))} />
                          <Input label="Cuerpo" value={editingAnnouncement.body} onChange={(e) => setEditingAnnouncement((prev) => ({ ...prev, body: e.target.value }))} />
                          <div className="flex gap-2">
                            <Button onClick={() => handleUpdateAnnouncement(announcement.id)} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</Button>
                            <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{announcement.title}</div>
                              <div className="text-sm text-gray-500 capitalize">{announcement.audience}</div>
                              {announcement.startsAt && <div className="text-xs text-gray-400">Desde: {formatDate(announcement.startsAt)}</div>}
                              {announcement.endsAt && <div className="text-xs text-gray-400">Hasta: {formatDate(announcement.endsAt)}</div>}
                            </div>
                            <Badge variant={announcement.isActive ? 'success' : 'warning'}>{announcement.isActive ? 'activo' : 'inactivo'}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{announcement.body}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEditingAnnouncement({ id: announcement.id, title: announcement.title, body: announcement.body, startsAt: formatForInput(announcement.startsAt), endsAt: formatForInput(announcement.endsAt) })}>Editar</Button>
                            <Button variant="danger" onClick={() => requestDelete('announcement', announcement.id, announcement.title)} disabled={busy}>Eliminar</Button>
                          </div>
                        </>
                      )}
                    </div>
                  )) : <div className="text-sm text-gray-500">No hay anuncios publicados.</div>}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'professors' && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Crear Profesor</h2>
                <form onSubmit={handleCreateProfessor} className="space-y-3">
                  <Input label="Email" value={professorForm.email} onChange={(e) => setProfessorForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="correo@prisma.edu" />
                  <Input label="Nombre Completo" value={professorForm.nombreCompleto} onChange={(e) => setProfessorForm((prev) => ({ ...prev, nombreCompleto: e.target.value }))} placeholder="Nombre del profesor" />
                  <Input label="Contraseña" type="password" value={professorForm.password} onChange={(e) => setProfessorForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Contraseña temporal" />
                  <SelectInput label="Rol" value={professorForm.role} onChange={(e) => setProfessorForm((prev) => ({ ...prev, role: e.target.value }))} options={[
                    { value: 'TEACHER', label: 'Profesor' },
                    { value: 'ADMIN', label: 'Administrador' },
                  ]} />
                  <Input label="Especialidad" value={professorForm.especialidad} onChange={(e) => setProfessorForm((prev) => ({ ...prev, especialidad: e.target.value }))} placeholder="Matemáticas, Física..." />
                  <Input label="Teléfono" value={professorForm.telefono} onChange={(e) => setProfessorForm((prev) => ({ ...prev, telefono: e.target.value }))} placeholder="+56912345678" />
                  <p className="text-xs text-gray-400">Se creará automáticamente un usuario con la contraseña y rol seleccionados.</p>
                  <Button type="submit" disabled={busy}>{busy ? 'Creando...' : 'Crear profesor'}</Button>
                </form>
              </div>
            </Card>

            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Profesores ({professors.length})</h2>
                <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
                  {professors.length ? professors.map((professor) => (
                    <div key={professor.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                      {editingProfessor?.id === professor.id ? (
                        <div className="space-y-2">
                          <Input label="Nombre" value={editingProfessor.nombreCompleto} onChange={(e) => setEditingProfessor((prev) => ({ ...prev, nombreCompleto: e.target.value }))} />
                          <Input label="Email" value={editingProfessor.email} onChange={(e) => setEditingProfessor((prev) => ({ ...prev, email: e.target.value }))} />
                          <Input label="Especialidad" value={editingProfessor.especialidad} onChange={(e) => setEditingProfessor((prev) => ({ ...prev, especialidad: e.target.value }))} />
                          <div className="flex gap-2">
                            <Button onClick={() => handleUpdateProfessor(professor.id)} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</Button>
                            <Button variant="outline" onClick={() => setEditingProfessor(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{professor.nombreCompleto}</div>
                              <div className="text-sm text-gray-500">{professor.email}</div>
                              {professor.especialidad && <div className="text-xs text-gray-400">{professor.especialidad}</div>}
                            </div>
                            <Badge variant={professor.isActive ? 'success' : 'warning'}>{professor.isActive ? 'activo' : 'inactivo'}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEditingProfessor({ id: professor.id, nombreCompleto: professor.nombreCompleto, email: professor.email, especialidad: professor.especialidad })}>Editar</Button>
                            <Button variant="danger" onClick={() => requestDelete('professor', professor.id, professor.nombreCompleto)} disabled={busy}>Eliminar</Button>
                          </div>
                        </>
                      )}
                    </div>
                  )) : <div className="text-sm text-gray-500">No hay profesores registrados.</div>}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Sesiones Activas ({activeSessions.length})</h2>
                <div className="space-y-3 max-h-[24rem] overflow-auto pr-1">
                  {activeSessions.length ? activeSessions.map((session) => (
                    <div key={session.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">User: {session.userId}</div>
                          <div className="text-sm text-gray-500">{session.userAgent || 'Sin user agent'}</div>
                          <div className="text-xs text-gray-400">IP: {session.ipAddress || 'N/A'} · Último acceso: {formatDate(session.lastAccess)}</div>
                          <div className="text-xs text-gray-400">Expira: {formatDate(session.expiresAt)}</div>
                        </div>
                        <Badge variant="success">Activa</Badge>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="danger" onClick={() => handleSessionAction('block', session.id)} disabled={busy}>Bloquear</Button>
                        <Button size="sm" variant="outline" onClick={() => handleSessionAction('terminate', session.id)} disabled={busy}>Terminar</Button>
                      </div>
                    </div>
                  )) : <div className="text-sm text-gray-500">No hay sesiones activas.</div>}
                </div>
              </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <div className="p-5 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 font-headline">Sesiones Bloqueadas ({blockedSessions.length})</h2>
                  <div className="space-y-3 max-h-[20rem] overflow-auto pr-1">
                    {blockedSessions.length ? blockedSessions.map((session) => (
                      <div key={session.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">User: {session.userId}</div>
                            <div className="text-xs text-gray-400">Último acceso: {formatDate(session.lastAccess)}</div>
                          </div>
                          <Badge variant="danger">Bloqueada</Badge>
                        </div>
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => handleSessionAction('unblock', session.id)} disabled={busy}>Desbloquear</Button>
                      </div>
                    )) : <div className="text-sm text-gray-500">No hay sesiones bloqueadas.</div>}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-5 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 font-headline">Historial de Sesiones ({historicalSessions.length})</h2>
                  <div className="space-y-3 max-h-[20rem] overflow-auto pr-1">
                    {historicalSessions.length ? historicalSessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">User: {session.userId}</div>
                            <div className="text-xs text-gray-400">Creada: {formatDate(session.createdAt)}</div>
                            <div className="text-xs text-gray-400">Expira: {formatDate(session.expiresAt)}</div>
                          </div>
                          <Badge variant={session.isBlocked ? 'danger' : 'info'}>{session.isBlocked ? 'Bloqueada' : 'Expirada'}</Badge>
                        </div>
                      </div>
                    )) : <div className="text-sm text-gray-500">No hay historial de sesiones.</div>}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <Card>
            <div className="p-5 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 font-headline">Auditoría ({auditLogs.length})</h2>
              <p className="text-sm text-gray-500">Historial de acciones relevantes de la plataforma.</p>
              <div className="space-y-3 max-h-[40rem] overflow-auto pr-1">
                {auditLogs.length ? auditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900">{log.action}</div>
                      <Badge variant="info">{log.entity}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {log.actorName ? (
                        <>
                          <span className="font-medium">{log.actorName}</span>
                          {log.actorEmail && <span className="text-gray-400 ml-1">&lt;{log.actorEmail}&gt;</span>}
                          <span className="text-xs text-gray-400 ml-1">({log.actorId})</span>
                        </>
                      ) : log.actorEmail ? (
                        <>
                          <span>{log.actorEmail}</span>
                          <span className="text-xs text-gray-400 ml-1">({log.actorId})</span>
                        </>
                      ) : (
                        <span>Actor: {log.actorId}</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 break-all">{log.entityId || 'sin entidad'}</div>
                    <div className="mt-1 text-xs text-gray-400">{formatDate(log.createdAt)}</div>
                  </div>
                )) : <div className="text-sm text-gray-500">No hay logs de auditoría aún.</div>}
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainContainer>
  );
};

export default AdminPanelPage;
