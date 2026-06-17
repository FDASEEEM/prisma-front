import React, { useState } from 'react';
import { Modal, Input, Button } from '../ui';
import colegioService from '../../services/colegioService';

// Función para validar RUT chileno
const validateRut = (rut) => {
  if (!rut) return 'El RUT es requerido';
  
  // Limpiar el RUT (quitar puntos y guión)
  const rutLimpio = rut.replace(/[.\-]/g, '').toUpperCase();
  
  // Verificar formato básico (números + dígito verificador)
  if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) {
    return 'Formato de RUT inválido (ej: 12.345.678-9)';
  }
  
  // Calcular dígito verificador
  const cuerpo = rutLimpio.slice(0, -1);
  const dvIngresado = rutLimpio.slice(-1);
  
  let suma = 0;
  let multiplo = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  
  const resto = suma % 11;
  const dvEsperado = resto === 0 ? '0' : resto === 1 ? 'K' : String(11 - resto);
  
  if (dvIngresado !== dvEsperado) {
    return 'RUT inválido (dígito verificador incorrecto)';
  }
  
  return null;
};

// Función para validar email
const validateEmail = (email) => {
  if (!email) return 'El email es requerido';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Formato de email inválido';
  }
  return null;
};

// Función para validar nombre (no solo números)
const validateNombre = (nombre, fieldName = 'El nombre') => {
  if (!nombre || nombre.trim().length === 0) {
    return `${fieldName} es requerido`;
  }
  if (nombre.trim().length < 3) {
    return `${fieldName} debe tener al menos 3 caracteres`;
  }
  if (/^\d+$/.test(nombre.trim())) {
    return `${fieldName} no puede contener solo números`;
  }
  return null;
};

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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar nombre del colegio
    const nombreError = validateNombre(formData.nombre, 'El nombre del colegio');
    if (nombreError) newErrors.nombre = nombreError;
    
    // Validar RUT
    const rutError = validateRut(formData.rut);
    if (rutError) newErrors.rut = rutError;
    
    // Validar dirección
    if (!formData.direccion || formData.direccion.trim().length < 5) {
      newErrors.direccion = 'La dirección debe tener al menos 5 caracteres';
    }
    
    // Validar email del colegio
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    // Validar teléfono (opcional pero si existe debe ser válido)
    if (formData.telefono && formData.telefono.trim().length > 0) {
      const telefonoLimpio = formData.telefono.replace(/[\s\-\+]/g, '');
      if (!/^\d{8,15}$/.test(telefonoLimpio)) {
        newErrors.telefono = 'Teléfono inválido (solo números, 8-15 dígitos)';
      }
    }
    
    // Validar nombre del admin
    const adminNombreError = validateNombre(formData.adminNombre, 'El nombre del administrador');
    if (adminNombreError) newErrors.adminNombre = adminNombreError;
    
    // Validar email del admin
    const adminEmailError = validateEmail(formData.adminEmail);
    if (adminEmailError) newErrors.adminEmail = adminEmailError;
    
    // Validar contraseña del admin
    if (!formData.adminPassword || formData.adminPassword.length < 8) {
      newErrors.adminPassword = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
      setErrors({});
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Colegio" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <div className="p-3 bg-error-container text-error rounded-lg text-sm">
            {errors.submit}
          </div>
        )}

        <h3 className="font-semibold text-on-surface text-lg">Datos del Colegio</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Nombre del Colegio *"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              error={errors.nombre}
              required
            />
          </div>
          <div>
            <Input
              label="RUT *"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="12.345.678-9"
              error={errors.rut}
              required
            />
          </div>
        </div>

        <div>
          <Input
            label="Dirección *"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            error={errors.direccion}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Email *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
          </div>
          <div>
            <Input
              label="Teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+56 9 1234 5678"
              error={errors.telefono}
            />
          </div>
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
          <div>
            <Input
              label="Fecha Inicio"
              name="fechaInicio"
              type="date"
              value={formData.fechaInicio}
              onChange={handleChange}
            />
          </div>
          <div>
            <Input
              label="Fecha Término"
              name="fechaTermino"
              type="date"
              value={formData.fechaTermino}
              onChange={handleChange}
            />
          </div>
        </div>

        <hr className="my-4 border-outline-variant/30" />

        <h3 className="font-semibold text-on-surface text-lg">Administrador del Colegio</h3>

        <div>
          <Input
            label="Nombre del Admin *"
            name="adminNombre"
            value={formData.adminNombre}
            onChange={handleChange}
            error={errors.adminNombre}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Email del Admin *"
              name="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={handleChange}
              error={errors.adminEmail}
              required
            />
          </div>
          <div>
            <Input
              label="Contraseña del Admin *"
              name="adminPassword"
              type="password"
              value={formData.adminPassword}
              onChange={handleChange}
              error={errors.adminPassword}
              required
            />
          </div>
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
