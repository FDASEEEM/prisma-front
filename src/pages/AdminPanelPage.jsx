import { useEffect, useMemo, useState } from 'react';
import MainContainer from '../components/layout/MainContainer';
import { Alert, Badge, Button, Card, Input, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import adminPanelService from '../services/adminPanelService';

const TABS = ['dashboard', 'tickets', 'resources', 'announcements', 'professors', 'sessions', 'audit'];

const emptyTicketForm = { requesterId: '', subject: '', message: '' };
const emptyResourceForm = { title: '', description: '', type: 'document', url: '', uploadedBy: '' };
const emptyAnnouncementForm = { title: '', body: '', audience: 'all', startsAt: '', endsAt: '', createdBy: '' };
const emptyProfessorForm = { userId: '', nombreCompleto: '', email: '', especialidad: '', telefono: '' };

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
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
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
      const [summaryResponse, ticketsResponse, resourcesResponse, announcementsResponse, auditLogsResponse, professorsResponse, activeSessionsResponse, historicalSessionsResponse, blockedSessionsResponse] = await Promise.all([
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

      setSummary(summaryResponse);
      setTickets(Array.isArray(ticketsResponse) ? ticketsResponse : ticketsResponse?.items || []);
      setResources(Array.isArray(resourcesResponse) ? resourcesResponse : resourcesResponse?.items || []);
      setAnnouncements(Array.isArray(announcementsResponse) ? announcementsResponse : announcementsResponse?.items || []);
      setAuditLogs(Array.isArray(auditLogsResponse) ? auditLogsResponse : auditLogsResponse?.items || []);
      setProfessors(Array.isArray(professorsResponse) ? professorsResponse : professorsResponse?.items || []);
      setActiveSessions(Array.isArray(activeSessionsResponse) ? activeSessionsResponse : []);
      setHistoricalSessions(Array.isArray(historicalSessionsResponse) ? historicalSessionsResponse : []);
      setBlockedSessions(Array.isArray(blockedSessionsResponse) ? blockedSessionsResponse : []);
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

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    try {
      setBusy(true);
      await adminPanelService.createTicket(ticketForm);
      setTicketForm(emptyTicketForm);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo crear el ticket');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateResource = async (event) => {
    event.preventDefault();
    try {
      setBusy(true);
      await adminPanelService.createResource(resourceForm);
      setResourceForm(emptyResourceForm);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo crear el recurso');
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
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el recurso');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();
    try {
      setBusy(true);
      await adminPanelService.createAnnouncement(announcementForm);
      setAnnouncementForm(emptyAnnouncementForm);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo crear el anuncio');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateAnnouncement = async (id) => {
    try {
      setBusy(true);
      await adminPanelService.updateAnnouncement(id, editingAnnouncement);
      setEditingAnnouncement(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el anuncio');
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
    } catch (err) {
      setError(err.message || 'No se pudo crear el profesor');
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
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el profesor');
    } finally {
      setBusy(false);
    }
  };

  const handleTicketStatus = async (id, status) => {
    try {
      setBusy(true);
      await adminPanelService.updateTicket(id, { status });
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el ticket');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      setBusy(true);
      if (type === 'ticket') await adminPanelService.deleteTicket(id);
      if (type === 'resource') await adminPanelService.deleteResource(id);
      if (type === 'announcement') await adminPanelService.deleteAnnouncement(id);
      if (type === 'professor') await adminPanelService.deleteProfessor(id);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el registro');
    } finally {
      setBusy(false);
    }
  };

  const handleSessionAction = async (action, id) => {
    try {
      setBusy(true);
      if (action === 'block') await adminPanelService.blockSession(id);
      if (action === 'unblock') await adminPanelService.unblockSession(id);
      if (action === 'terminate') await adminPanelService.terminateSession(id);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo ejecutar la acción');
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('es-CL');
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
            <TabButton key={tab} active={activeTab === tab} label={tab.charAt(0).toUpperCase() + tab.slice(1)} onClick={() => setActiveTab(tab)} />
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
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Crear Ticket</h2>
                <form onSubmit={handleCreateTicket} className="space-y-3">
                  <Input label="Requester ID" value={ticketForm.requesterId} onChange={(e) => setTicketForm((prev) => ({ ...prev, requesterId: e.target.value }))} />
                  <Input label="Asunto" value={ticketForm.subject} onChange={(e) => setTicketForm((prev) => ({ ...prev, subject: e.target.value }))} />
                  <Input label="Mensaje" value={ticketForm.message} onChange={(e) => setTicketForm((prev) => ({ ...prev, message: e.target.value }))} />
                  <Button type="submit" disabled={busy}>Crear ticket</Button>
                </form>
              </div>
            </Card>

            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Tickets</h2>
                <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
                  {tickets.length ? tickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">{ticket.subject}</div>
                          <div className="text-sm text-gray-500">{ticket.requesterId}</div>
                        </div>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p className="text-sm text-gray-600">{ticket.message}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => handleTicketStatus(ticket.id, 'open')} disabled={busy}>Abrir</Button>
                        <Button variant="outline" onClick={() => handleTicketStatus(ticket.id, 'in_progress')} disabled={busy}>En proceso</Button>
                        <Button variant="outline" onClick={() => handleTicketStatus(ticket.id, 'closed')} disabled={busy}>Cerrar</Button>
                        <Button variant="danger" onClick={() => handleDelete('ticket', ticket.id)} disabled={busy}>Eliminar</Button>
                      </div>
                    </div>
                  )) : <div className="text-sm text-gray-500">No hay tickets registrados.</div>}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Crear Recurso</h2>
                <form onSubmit={handleCreateResource} className="space-y-3">
                  <Input label="Título" value={resourceForm.title} onChange={(e) => setResourceForm((prev) => ({ ...prev, title: e.target.value }))} />
                  <Input label="Descripción" value={resourceForm.description} onChange={(e) => setResourceForm((prev) => ({ ...prev, description: e.target.value }))} />
                  <Input label="Tipo" value={resourceForm.type} onChange={(e) => setResourceForm((prev) => ({ ...prev, type: e.target.value }))} />
                  <Input label="URL" value={resourceForm.url} onChange={(e) => setResourceForm((prev) => ({ ...prev, url: e.target.value }))} />
                  <Input label="Subido por" value={resourceForm.uploadedBy} onChange={(e) => setResourceForm((prev) => ({ ...prev, uploadedBy: e.target.value }))} />
                  <Button type="submit" disabled={busy}>Crear recurso</Button>
                </form>
              </div>
            </Card>

            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Recursos</h2>
                <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
                  {resources.length ? resources.map((resource) => (
                    <div key={resource.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                      {editingResource?.id === resource.id ? (
                        <div className="space-y-2">
                          <Input label="Título" value={editingResource.title} onChange={(e) => setEditingResource((prev) => ({ ...prev, title: e.target.value }))} />
                          <Input label="URL" value={editingResource.url} onChange={(e) => setEditingResource((prev) => ({ ...prev, url: e.target.value }))} />
                          <div className="flex gap-2">
                            <Button onClick={() => handleUpdateResource(resource.id)} disabled={busy}>Guardar</Button>
                            <Button variant="outline" onClick={() => setEditingResource(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{resource.title}</div>
                              <div className="text-sm text-gray-500">{resource.type}</div>
                            </div>
                            <Badge variant="info">{resource.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 break-all">{resource.url}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEditingResource({ id: resource.id, title: resource.title, url: resource.url })}>Editar</Button>
                            <Button variant="danger" onClick={() => handleDelete('resource', resource.id)} disabled={busy}>Eliminar</Button>
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
                  <Input label="Título" value={announcementForm.title} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))} />
                  <Input label="Cuerpo" value={announcementForm.body} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, body: e.target.value }))} />
                  <Input label="Audiencia" value={announcementForm.audience} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, audience: e.target.value }))} />
                  <Input label="Publicado por" value={announcementForm.createdBy} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, createdBy: e.target.value }))} />
                  <Input label="Inicio" value={announcementForm.startsAt} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, startsAt: e.target.value }))} />
                  <Input label="Fin" value={announcementForm.endsAt} onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, endsAt: e.target.value }))} />
                  <Button type="submit" disabled={busy}>Crear anuncio</Button>
                </form>
              </div>
            </Card>

            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Anuncios</h2>
                <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
                  {announcements.length ? announcements.map((announcement) => (
                    <div key={announcement.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                      {editingAnnouncement?.id === announcement.id ? (
                        <div className="space-y-2">
                          <Input label="Título" value={editingAnnouncement.title} onChange={(e) => setEditingAnnouncement((prev) => ({ ...prev, title: e.target.value }))} />
                          <Input label="Cuerpo" value={editingAnnouncement.body} onChange={(e) => setEditingAnnouncement((prev) => ({ ...prev, body: e.target.value }))} />
                          <div className="flex gap-2">
                            <Button onClick={() => handleUpdateAnnouncement(announcement.id)} disabled={busy}>Guardar</Button>
                            <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-gray-900">{announcement.title}</div>
                              <div className="text-sm text-gray-500">{announcement.audience}</div>
                            </div>
                            <Badge variant={announcement.isActive ? 'success' : 'warning'}>{announcement.isActive ? 'activo' : 'inactivo'}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{announcement.body}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEditingAnnouncement({ id: announcement.id, title: announcement.title, body: announcement.body })}>Editar</Button>
                            <Button variant="danger" onClick={() => handleDelete('announcement', announcement.id)} disabled={busy}>Eliminar</Button>
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
                  <Input label="User ID" value={professorForm.userId} onChange={(e) => setProfessorForm((prev) => ({ ...prev, userId: e.target.value }))} />
                  <Input label="Nombre Completo" value={professorForm.nombreCompleto} onChange={(e) => setProfessorForm((prev) => ({ ...prev, nombreCompleto: e.target.value }))} />
                  <Input label="Email" value={professorForm.email} onChange={(e) => setProfessorForm((prev) => ({ ...prev, email: e.target.value }))} />
                  <Input label="Especialidad" value={professorForm.especialidad} onChange={(e) => setProfessorForm((prev) => ({ ...prev, especialidad: e.target.value }))} />
                  <Input label="Teléfono" value={professorForm.telefono} onChange={(e) => setProfessorForm((prev) => ({ ...prev, telefono: e.target.value }))} />
                  <Button type="submit" disabled={busy}>Crear profesor</Button>
                </form>
              </div>
            </Card>

            <Card>
              <div className="p-5 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Profesores</h2>
                <div className="space-y-3 max-h-[36rem] overflow-auto pr-1">
                  {professors.length ? professors.map((professor) => (
                    <div key={professor.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                      {editingProfessor?.id === professor.id ? (
                        <div className="space-y-2">
                          <Input label="Nombre" value={editingProfessor.nombreCompleto} onChange={(e) => setEditingProfessor((prev) => ({ ...prev, nombreCompleto: e.target.value }))} />
                          <Input label="Email" value={editingProfessor.email} onChange={(e) => setEditingProfessor((prev) => ({ ...prev, email: e.target.value }))} />
                          <Input label="Especialidad" value={editingProfessor.especialidad} onChange={(e) => setEditingProfessor((prev) => ({ ...prev, especialidad: e.target.value }))} />
                          <div className="flex gap-2">
                            <Button onClick={() => handleUpdateProfessor(professor.id)} disabled={busy}>Guardar</Button>
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
                            <Button variant="danger" onClick={() => handleDelete('professor', professor.id)} disabled={busy}>Eliminar</Button>
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
                <h2 className="text-2xl font-bold text-gray-900 font-headline">Sesiones Activas</h2>
                <div className="space-y-3 max-h-[24rem] overflow-auto pr-1">
                  {activeSessions.length ? activeSessions.map((session) => (
                    <div key={session.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">User: {session.userId}</div>
                          <div className="text-sm text-gray-500">{session.userAgent || 'Sin user agent'}</div>
                          <div className="text-xs text-gray-400">IP: {session.ipAddress || 'N/A'} | Último acceso: {formatDate(session.lastAccess)}</div>
                          <div className="text-xs text-gray-400">Expira: {formatDate(session.expiresAt)}</div>
                        </div>
                        <Badge variant="success">Activa</Badge>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="danger" onClick={() => handleSessionAction('block', session.id)} disabled={busy}>Bloquear</Button>
                        <Button variant="outline" onClick={() => handleSessionAction('terminate', session.id)} disabled={busy}>Terminar</Button>
                      </div>
                    </div>
                  )) : <div className="text-sm text-gray-500">No hay sesiones activas.</div>}
                </div>
              </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <div className="p-5 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 font-headline">Sesiones Bloqueadas</h2>
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
                        <Button variant="outline" className="mt-2" onClick={() => handleSessionAction('unblock', session.id)} disabled={busy}>Desbloquear</Button>
                      </div>
                    )) : <div className="text-sm text-gray-500">No hay sesiones bloqueadas.</div>}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-5 space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 font-headline">Historial de Sesiones</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 font-headline">Auditoría</h2>
              <p className="text-sm text-gray-500">Historial de acciones relevantes de la plataforma.</p>
              <div className="space-y-3 max-h-[40rem] overflow-auto pr-1">
                {auditLogs.length ? auditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900">{log.action}</div>
                      <Badge variant="info">{log.entity}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">Actor: {log.actorId}</div>
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
