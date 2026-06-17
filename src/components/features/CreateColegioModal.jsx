import React, { useState } from 'react';
import { Modal, Input, Button } from '../ui';
import colegioService from '../../services/colegioService';

const CreateColegioModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    rut: '',
    plan: 'basic',
    fechaInicio: '',
    fechaTermino: '',
    adminEmail: '',
    adminPassword: '',
    adminNombre: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await colegioService.create(formData);
      onSuccess();
      onClose();
      setFormData({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        rut: '',
        plan: 'basic',
        fechaInicio: '',
        fechaTermino: '',
        adminEmail: '',
        adminPassword: '',
        adminNombre: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Colegio" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-error-container text-error rounded-lg text-sm">
            {error}
          </div>
        )}

        <h3 className="font-semibold text-on-surface text-lg">Datos del Colegio</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Colegio *"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
          <Input
            label="RUT *"
            name="rut"
            value={formData.rut}
            onChange={handleChange}
            placeholder="76.543.210-K"
            required
          />
        </div>

        <Input
          label="Dirección *"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email *"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            label="Fecha Inicio"
            name="fechaInicio"
            type="date"
            value={formData.fechaInicio}
            onChange={handleChange}
          />
          <Input
            label="Fecha Término"
            name="fechaTermino"
            type="date"
            value={formData.fechaTermino}
            onChange={handleChange}
          />
        </div>

        <hr className="my-4 border-outline-variant/30" />

        <h3 className="font-semibold text-on-surface text-lg">Administrador del Colegio</h3>

        <Input
          label="Nombre del Admin *"
          name="adminNombre"
          value={formData.adminNombre}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email del Admin *"
            name="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={handleChange}
            required
          />
          <Input
            label="Contraseña del Admin *"
            name="adminPassword"
            type="password"
            value={formData.adminPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Crear Colegio
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateColegioModal;
