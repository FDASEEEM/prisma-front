import React, { useState, useEffect } from 'react';
import { Button, Badge, Input } from '../components';
import MainContainer from '../components/layout/MainContainer';
import CreateColegioModal from '../components/features/CreateColegioModal';
import EditColegioModal from '../components/features/EditColegioModal';
import ViewColegioModal from '../components/features/ViewColegioModal';
import colegioService from '../services/colegioService';

const ColegiosPage = () => {
  const [colegios, setColegios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedColegioId, setSelectedColegioId] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    plan: '',
    activo: '',
  });

  useEffect(() => {
    document.title = 'P.R.I.S.M.A. - Gestión de Colegios';
    loadColegios();
  }, [pagination.page, filters]);

  const loadColegios = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.activo !== '') params.activo = filters.activo;
      if (filters.plan) params.plan = filters.plan;

      const data = await colegioService.getAll(params);
      setColegios(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (id) => {
    setSelectedColegioId(id);
    setShowEditModal(true);
  };

  const handleView = (id) => {
    setSelectedColegioId(id);
    setShowViewModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('¿Estás seguro de desactivar este colegio?')) return;
    try {
      await colegioService.deactivate(id);
      loadColegios();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-CL');
  };

  const filteredColegios = colegios.filter(c => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.rut.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <MainContainer>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">Gestión de Colegios</h1>
            <p className="text-on-surface-variant mt-1">
              Administra los colegios del sistema y sus administradores
            </p>
          </div>
          <Button variant="primary" onClick={handleCreate} icon="add">
            Nuevo Colegio
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-error-container text-error rounded-xl">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nombre, email o RUT..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="search"
            />
          </div>
          <div>
            <select
              value={filters.plan}
              onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
              className="px-4 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los planes</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <select
              value={filters.activo}
              onChange={(e) => setFilters(prev => ({ ...prev, activo: e.target.value }))}
              className="px-4 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredColegios.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">
                school
              </span>
              <p className="text-on-surface-variant">No se encontraron colegios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low border-b border-outline-variant/20">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-on-surface-variant">Nombre</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-on-surface-variant">RUT</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-on-surface-variant">Plan</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-on-surface-variant">Usuarios</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-on-surface-variant">Admins</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-on-surface-variant">Estado</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-on-surface-variant">Fecha Término</th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-on-surface-variant">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredColegios.map((colegio) => (
                    <tr key={colegio.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-on-surface">{colegio.nombre}</p>
                          <p className="text-sm text-on-surface-variant">{colegio.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface">{colegio.rut}</td>
                      <td className="px-6 py-4">
                        <Badge variant={colegio.plan === 'premium' ? 'warning' : colegio.plan === 'standard' ? 'info' : 'default'}>
                          {colegio.plan}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-on-surface">
                        {colegio._count?.users || 0}
                      </td>
                      <td className="px-6 py-4 text-on-surface">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-container/30 text-primary text-xs font-medium rounded-full">
                          {colegio._count?.admins ?? 0}
                          {colegio._count?.activeAdmins !== undefined &&
                            colegio._count.activeAdmins < colegio._count.admins && (
                              <span className="text-on-surface-variant">
                                ({colegio._count.activeAdmins} activos)
                              </span>
                            )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={colegio.activo ? 'success' : 'error'}>
                          {colegio.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-sm">
                        {formatDate(colegio.fechaTermino)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(colegio.id)}
                            className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-primary-container/20 transition-colors"
                            title="Ver detalle"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button
                            onClick={() => handleEdit(colegio.id)}
                            className="p-2 text-on-surface-variant hover:text-secondary rounded-full hover:bg-secondary-container/20 transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          {colegio.activo && (
                            <button
                              onClick={() => handleDeactivate(colegio.id)}
                              className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error-container/20 transition-colors"
                              title="Desactivar"
                            >
                              <span className="material-symbols-outlined text-lg">block</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/20">
              <p className="text-sm text-on-surface-variant">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>

        <CreateColegioModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadColegios}
        />

        <EditColegioModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadColegios}
          colegioId={selectedColegioId}
        />

        <ViewColegioModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          colegioId={selectedColegioId}
        />
      </div>
    </MainContainer>
  );
};

export default ColegiosPage;
