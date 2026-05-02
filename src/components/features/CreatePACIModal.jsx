/**
 * CreatePACIModal
 * Modal para crear un nuevo perfil PACI y estudiante
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import paciService from '../../services/paciService';

const CreatePACIModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estudiante
  const [studentData, setStudentData] = useState({
    nombreCompleto: '',
    fechaNacimiento: '',
    cursoActual: '',
  });

  // PACI
  const [paciData, setPaciData] = useState({
    diagnostico: '',
    fechaElaboracion: '',
    fechaRevision: '',
    duracion: '',
    validFrom: '',
    validUntil: '',
    datosEstructurales: {},
  });

  const handleStudentChange = (e) => {
    setStudentData({
      ...studentData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePaciChange = (e) => {
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
      // Crear estudiante primero
      const student = await paciService.createStudent({
        userId: user?.id || 'demo-user-id',
        ...studentData,
      });

      // Crear perfil PACI
      await paciService.createPACI({
        studentId: student.id,
        userId: user?.id || 'demo-user-id',
        ...paciData,
      });

      onSuccess && onSuccess();
      onClose();
      
      // Reset form
      setStudentData({
        nombreCompleto: '',
        fechaNacimiento: '',
        cursoActual: '',
      });
      setPaciData({
        diagnostico: '',
        fechaElaboracion: '',
        fechaRevision: '',
        duracion: '',
        validFrom: '',
        validUntil: '',
        datosEstructurales: {},
      });
    } catch (err) {
      setError(err.message || 'Error al crear perfil PACI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Perfil PACI" size="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-error-container/10 border border-error text-error px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Sección Estudiante */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Datos del Estudiante</h3>
          
          <Input
            label="Nombre Completo"
            name="nombreCompleto"
            value={studentData.nombreCompleto}
            onChange={handleStudentChange}
            placeholder="Ingrese el nombre completo"
            required
          />

          <Input
            label="Fecha de Nacimiento"
            type="date"
            name="fechaNacimiento"
            value={studentData.fechaNacimiento}
            onChange={handleStudentChange}
            required
          />

          <Input
            label="Curso Actual"
            name="cursoActual"
            value={studentData.cursoActual}
            onChange={handleStudentChange}
            placeholder="Ej: 3° Básico"
            required
          />
        </div>

        {/* Sección PACI */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Datos del PACI</h3>
          
          <Input
            label="Diagnóstico"
            name="diagnostico"
            value={paciData.diagnostico}
            onChange={handlePaciChange}
            placeholder="Ej: TEA, TDAH, Dislexia"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Elaboración"
              type="date"
              name="fechaElaboracion"
              value={paciData.fechaElaboracion}
              onChange={handlePaciChange}
              required
            />

            <Input
              label="Fecha Revisión"
              type="date"
              name="fechaRevision"
              value={paciData.fechaRevision}
              onChange={handlePaciChange}
              required
            />
          </div>

          <Input
            label="Duración"
            name="duracion"
            value={paciData.duracion}
            onChange={handlePaciChange}
            placeholder="Ej: 1 año escolar"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Válido Desde"
              type="date"
              name="validFrom"
              value={paciData.validFrom}
              onChange={handlePaciChange}
              required
            />

            <Input
              label="Válido Hasta"
              type="date"
              name="validUntil"
              value={paciData.validUntil}
              onChange={handlePaciChange}
              required
            />
          </div>
        </div>

        {/* Botones */}
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
            Crear Perfil PACI
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePACIModal;
