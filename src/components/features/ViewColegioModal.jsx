import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge } from '../ui';
import colegioService from '../../services/colegioService';

const ViewColegioModal = ({ isOpen, onClose, colegioId }) => {
  const [colegio, setColegio] = useState(null);
  const [stats, setStats] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (isOpen && colegioId) {
      loadColegio();
    }
  }, [isOpen, colegioId]);

  const loadColegio = async () => {
    setLoading(true);
    try {
      const [colegioData, statsData, professorsData] = await Promise.all([
        colegioService.getById(colegioId),
        colegioService.getStats(colegioId),
        colegioService.getProfessors(colegioId),
      ]);
      setColegio(colegioData);
      setStats(statsData);
      setProfessors(professorsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-CL');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del Colegio" size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : colegio ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">{colegio.nombre}</h2>
            <Badge variant={colegio.activo ? 'success' : 'error'}>
              {colegio.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          <div className="flex gap-2 border-b border-outline-variant/30">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Información
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('professors')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'professors'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Profesores ({professors.length})
            </button>
          </div>

          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-on-surface-variant">RUT</p>
                <p className="font-medium text-on-surface">{colegio.rut}</p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Email</p>
                <p className="font-medium text-on-surface">{colegio.email}</p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Teléfono</p>
                <p className="font-medium text-on-surface">{colegio.telefono || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Plan</p>
                <p className="font-medium text-on-surface capitalize">{colegio.plan}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-on-surface-variant">Dirección</p>
                <p className="font-medium text-on-surface">{colegio.direccion}</p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Fecha Inicio</p>
                <p className="font-medium text-on-surface">{formatDate(colegio.fechaInicio)}</p>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">Fecha Término</p>
                <p className="font-medium text-on-surface">{formatDate(colegio.fechaTermino)}</p>
              </div>
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-surface-container-low rounded-xl text-center">
                <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
                <p className="text-sm text-on-surface-variant">Total Usuarios</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl text-center">
                <p className="text-3xl font-bold text-success">{stats.activeUsers}</p>
                <p className="text-sm text-on-surface-variant">Activos</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl text-center">
                <p className="text-3xl font-bold text-secondary">{stats.admins}</p>
                <p className="text-sm text-on-surface-variant">Admins</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl text-center">
                <p className="text-3xl font-bold text-info">{stats.teachers}</p>
                <p className="text-sm text-on-surface-variant">Profesores</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl text-center">
                <p className="text-3xl font-bold text-warning">{stats.superadmins}</p>
                <p className="text-sm text-on-surface-variant">SuperAdmins</p>
              </div>
            </div>
          )}

          {activeTab === 'professors' && (
            <div className="max-h-64 overflow-y-auto">
              {professors.length === 0 ? (
                <p className="text-center text-on-surface-variant py-4">
                  No hay profesores registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {professors.map(prof => (
                    <div
                      key={prof.id}
                      className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-on-surface">{prof.nombreCompleto}</p>
                        <p className="text-sm text-on-surface-variant">{prof.email}</p>
                      </div>
                      <Badge variant={prof.active ? 'success' : 'error'}>
                        {prof.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ViewColegioModal;
