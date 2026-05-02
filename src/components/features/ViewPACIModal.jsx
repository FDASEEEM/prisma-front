/**
 * ViewPACIModal
 * Modal para ver un perfil PACI (read-only, para históricos)
 */

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import paciService from '../../services/paciService';

const ViewPACIModal = ({ isOpen, onClose, paciId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paci, setPaci] = useState(null);

  useEffect(() => {
    if (isOpen && paciId) {
      loadPACI();
    }
  }, [isOpen, paciId]);

  const loadPACI = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paciService.getPACIById(paciId);
      setPaci(data);
    } catch (err) {
      setError(err.message || 'Error al cargar perfil PACI');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Ver Perfil PACI" size="2xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Ver Perfil PACI" size="2xl">
        <div className="bg-error-container/10 border border-error text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      </Modal>
    );
  }

  if (!paci) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ver Perfil PACI" size="2xl">
      <div className="space-y-6">
        {/* Estado Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={paci.isActive ? 'success' : 'info'}>
            {paci.isActive ? 'Activo' : 'Histórico'}
          </Badge>
          <span className="text-sm text-gray-500">
            Creado: {new Date(paci.createdAt).toLocaleDateString('es-CL')}
          </span>
        </div>

        {/* Datos del Estudiante */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Datos del Estudiante</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="font-medium text-gray-900">{paci.student?.nombreCompleto || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Curso</p>
              <p className="font-medium text-gray-900">{paci.student?.cursoActual || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha Nacimiento</p>
              <p className="font-medium text-gray-900">
                {paci.student?.fechaNacimiento 
                  ? new Date(paci.student.fechaNacimiento).toLocaleDateString('es-CL')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ID Estudiante</p>
              <p className="font-medium text-gray-900 text-sm">{paci.student?.id || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Datos del PACI */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Datos del PACI</h3>
          
          <div>
            <p className="text-sm text-gray-500">Diagnóstico</p>
            <p className="font-medium text-gray-900">{paci.diagnostico || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Fecha Elaboración</p>
              <p className="font-medium text-gray-900">
                {paci.fechaElaboracion 
                  ? new Date(paci.fechaElaboracion).toLocaleDateString('es-CL')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha Revisión</p>
              <p className="font-medium text-gray-900">
                {paci.fechaRevision 
                  ? new Date(paci.fechaRevision).toLocaleDateString('es-CL')
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Duración</p>
            <p className="font-medium text-gray-900">{paci.duracion || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Válido Desde</p>
              <p className="font-medium text-gray-900">
                {paci.validFrom 
                  ? new Date(paci.validFrom).toLocaleDateString('es-CL')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Válido Hasta</p>
              <p className="font-medium text-gray-900">
                {paci.validUntil 
                  ? new Date(paci.validUntil).toLocaleDateString('es-CL')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {!paci.isActive && paci.previousProfileId && (
          <div className="bg-primary-container/10 border border-primary/20 p-4 rounded-lg">
            <p className="text-sm text-on-surface">
              <strong>Versión anterior:</strong> {paci.previousProfileId}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewPACIModal;
