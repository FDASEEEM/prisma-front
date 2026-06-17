import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from '../ui';
import colegioService from '../../services/colegioService';

const EditColegioModal = ({ isOpen, onClose, onSuccess, colegioId }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    plan: 'basic',
    fechaTermino: '',
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && colegioId) {
      loadColegio();
    }
  }, [isOpen, colegioId]);

  const loadColegio = async () => {
    setLoadingData(true);
    try {
      const data = await colegioService.getById(colegioId);
      setFormData({
        nombre: data.nombre || '',
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        plan: data.plan || 'basic',
        fechaTermino: data.fechaTermino ? data.fechaTermino.split('T')[0] : '',
        activo: data.activo ?? true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        fechaTermino: formData.fechaTermino || undefined,
      };
      await colegioService.update(colegioId, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Colegio" size="md">
      {loadingData ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-error-container text-error rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="Nombre del Colegio"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />

          <Input
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            required
          />

          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Plan</label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <Input
              label="Fecha Término"
              name="fechaTermino"
              type="date"
              value={formData.fechaTermino}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="w-4 h-4 rounded border-outline-variant"
            />
            <label htmlFor="activo" className="text-sm text-on-surface">
              Colegio activo
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditColegioModal;
