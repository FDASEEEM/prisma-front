/**
 * EditPACIModal
 * Modal para editar un perfil PACI existente
 */

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import paciService from '../../services/paciService';

const EditPACIModal = ({ isOpen, onClose, onSuccess, paciId }) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);

  const [paciData, setPaciData] = useState({
    diagnostico: '',
    fechaElaboracion: '',
    fechaRevision: '',
    duracion: '',
    validFrom: '',
    validUntil: '',
    datosEstructurales: {},
  });

  // Cargar datos del PACI al abrir el modal
  useEffect(() => {
    if (isOpen && paciId) {
      loadPACI();
    }
  }, [isOpen, paciId]);

  const loadPACI = async () => {
    setFetchLoading(true);
    setError(null);
    try {
      const paci = await paciService.getPACIById(paciId);
      setPaciData({
        diagnostico: paci.diagnostico || '',
        fechaElaboracion: paci.fechaElaboracion ? paci.fechaElaboracion.split('T')[0] : '',
        fechaRevision: paci.fechaRevision ? paci.fechaRevision.split('T')[0] : '',
        duracion: paci.duracion || '',
        validFrom: paci.validFrom ? paci.validFrom.split('T')[0] : '',
        validUntil: paci.validUntil ? paci.validUntil.split('T')[0] : '',
        datosEstructurales: paci.datosEstructurales || {},
      });
    } catch (err) {
      setError(err.message || 'Error al cargar perfil PACI');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setPaciData({
      ...paciData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await paciService.updatePACI(paciId, paciData);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar perfil PACI');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil PACI" size="2xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil PACI" size="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-error-container/10 border border-error text-error px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-primary-container/10 border border-primary/20 p-4 rounded-lg">
          <p className="text-sm text-on-surface">
            <strong>Nota:</strong> Al guardar este perfil, la versión anterior se archivará automáticamente en el historial.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Diagnóstico"
            name="diagnostico"
            value={paciData.diagnostico}
            onChange={handleChange}
            placeholder="Ej: TEA, TDAH, Dislexia"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Elaboración"
              type="date"
              name="fechaElaboracion"
              value={paciData.fechaElaboracion}
              onChange={handleChange}
              required
            />

            <Input
              label="Fecha Revisión"
              type="date"
              name="fechaRevision"
              value={paciData.fechaRevision}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Duración"
            name="duracion"
            value={paciData.duracion}
            onChange={handleChange}
            placeholder="Ej: 1 año escolar"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Válido Desde"
              type="date"
              name="validFrom"
              value={paciData.validFrom}
              onChange={handleChange}
              required
            />

            <Input
              label="Válido Hasta"
              type="date"
              name="validUntil"
              value={paciData.validUntil}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditPACIModal;
