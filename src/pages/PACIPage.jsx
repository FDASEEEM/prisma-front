/**
 * PACIPage
 * Página de gestión de perfiles PACI con tabs y filtros
 */

import { useState, useEffect } from 'react';
import { MainContainer, Button, Card, Badge, Spinner, Alert } from '../components';
import CreatePACIModal from '../components/features/CreatePACIModal';
import EditPACIModal from '../components/features/EditPACIModal';
import ViewPACIModal from '../components/features/ViewPACIModal';
import paciService from '../services/paciService';

const PACIPage = () => {
  const [activeTab, setActiveTab] = useState('activos');
  const [pacis, setPacis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPaciId, setSelectedPaciId] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    studentId: '',
    curso: '',
    fromDate: '',
    toDate: '',
  });

  useEffect(() => {
    loadPACIs();
  }, [activeTab]);

  const loadPACIs = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      switch (activeTab) {
        case 'activos':
          data = await paciService.getActivePACIs();
          break;
        case 'historial':
          data = await paciService.getHistoricalPACIs();
          break;
        case 'recientes':
          data = await paciService.getRecentPACIs(10);
          break;
        default:
          data = await paciService.getActivePACIs();
      }
      setPacis(Array.isArray(data) ? data : (data?.data ?? data?.items ?? []));
    } catch (err) {
      setError(err.message || 'Error al cargar perfiles PACI');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    setLoading(true);
    setError(null);
    try {
      const filterData = {
        studentId: filters.studentId || undefined,
        isActive: activeTab === 'activos' ? true : activeTab === 'historial' ? false : undefined,
        curso: filters.curso || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      };
      const data = await paciService.getAllPACIs(filterData);
      setPacis(Array.isArray(data) ? data : (data?.data ?? data?.items ?? []));
    } catch (err) {
      setError(err.message || 'Error al filtrar perfiles PACI');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      studentId: '',
      curso: '',
      fromDate: '',
      toDate: '',
    });
    loadPACIs();
  };

  const handleCreateSuccess = () => {
    loadPACIs();
  };

  const handleEditSuccess = () => {
    loadPACIs();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este perfil PACI?')) {
      return;
    }
    try {
      await paciService.deletePACI(id);
      loadPACIs();
    } catch (err) {
      setError(err.message || 'Error al eliminar perfil PACI');
    }
  };

  const handleEdit = (id) => {
    setSelectedPaciId(id);
    setShowEditModal(true);
  };

  const handleView = (id) => {
    setSelectedPaciId(id);
    setShowViewModal(true);
  };

  return (
    <MainContainer title="Gestión de Perfiles PACI">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-4xl text-on-surface tracking-tight">
              Perfiles PACI
            </h1>
            <p className="text-on-surface-variant mt-2">
              Gestión de Planes de Adaptación Curricular Individualizado
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            + Nuevo PACI
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'activos', label: 'PACIs Activos' },
              { id: 'historial', label: 'Historial' },
              { id: 'recientes', label: 'Recientes' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filtros */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="ID Estudiante"
                value={filters.studentId}
                onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Curso"
                value={filters.curso}
                onChange={(e) => setFilters({ ...filters, curso: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                type="date"
                placeholder="Desde"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                type="date"
                placeholder="Hasta"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleFilter}>
                Filtrar
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </Card>

        {/* Lista de PACIs */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : pacis.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">
                {activeTab === 'activos' && 'No hay perfiles PACI activos'}
                {activeTab === 'historial' && 'No hay perfiles en el historial'}
                {activeTab === 'recientes' && 'No hay perfiles recientes'}
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Estudiante</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Curso</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Diagnóstico</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vigencia</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Creado</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacis.map((paci) => (
                    <tr key={paci.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {paci.student?.nombreCompleto || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {paci.student?.cursoActual || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="info">{paci.diagnostico || 'N/A'}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={paci.isActive ? 'success' : 'info'}>
                          {paci.isActive ? 'Activo' : 'Histórico'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {paci.validFrom && paci.validUntil
                          ? `${new Date(paci.validFrom).toLocaleDateString('es-CL')} - ${new Date(paci.validUntil).toLocaleDateString('es-CL')}`
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(paci.createdAt).toLocaleDateString('es-CL')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(paci.id)}
                            className="text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors"
                          >
                            Ver
                          </button>
                          {paci.isActive && (
                            <>
                              <button
                                onClick={() => handleEdit(paci.id)}
                                className="text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(paci.id)}
                                className="text-error hover:text-error-700 font-semibold text-sm transition-colors"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <CreatePACIModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
      <EditPACIModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        paciId={selectedPaciId}
      />
      <ViewPACIModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        paciId={selectedPaciId}
      />
    </MainContainer>
  );
};

export default PACIPage;
