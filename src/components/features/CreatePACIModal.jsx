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

const COURSE_OPTIONS = [
  '1° Básico',
  '2° Básico',
  '3° Básico',
  '4° Básico',
  '5° Básico',
  '6° Básico',
  '7° Básico',
  '8° Básico',
  '1° Medio',
  '2° Medio',
  '3° Medio',
  '4° Medio',
];

const DIAGNOSIS_OPTIONS = {
  Permanentes: [
    'TEA',
    'Discapacidad Motriz',
    'Discapacidad Sensorial', 
  ],
  Transitorias: [
    'Dificultades Especificas del Aprendizaje',
    'TDAH',
    'Funcionamiento Intelectual Limitrofe (FEL)',
  ],
};

const SEMESTER_OPTIONS = [
  'Semestre 1',
  'Semestre 2',
];

const getBaseYear = (dateValue) => {
  if (!dateValue) return new Date().getFullYear();
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return new Date().getFullYear();
  return parsed.getFullYear();
};

const formatDateInput = (date) => date.toISOString().slice(0, 10);

const getSemesterRange = (semester, year) => {
  if (semester === 'Semestre 1') {
    return {
      validFrom: formatDateInput(new Date(Date.UTC(year, 2, 1))),
      validUntil: formatDateInput(new Date(Date.UTC(year, 6, 31))),
    };
  }

  if (semester === 'Semestre 2') {
    return {
      validFrom: formatDateInput(new Date(Date.UTC(year, 7, 1))),
      validUntil: formatDateInput(new Date(Date.UTC(year, 11, 31))),
    };
  }

  return { validFrom: '', validUntil: '' };
};

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
    const { name, value } = e.target;
    const nextData = {
      ...paciData,
      [name]: value,
    };

    if (name === 'duracion' || name === 'fechaElaboracion') {
      const baseYear = getBaseYear(name === 'fechaElaboracion' ? value : paciData.fechaElaboracion);
      const { validFrom, validUntil } = getSemesterRange(name === 'duracion' ? value : paciData.duracion, baseYear);

      nextData.validFrom = validFrom;
      nextData.validUntil = validUntil;
    }

    setPaciData(nextData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Normalizar fechas del estudiante a formato ISO
      const normalizedStudent = {
        ...studentData,
        fechaNacimiento: studentData.fechaNacimiento
          ? studentData.fechaNacimiento.split('/').reverse().join('-')
          : '',
      };

      // Crear estudiante primero
      const student = await paciService.createStudent(normalizedStudent);

      // Crear perfil PACI
      await paciService.createPACI({
        studentId: student.id,
        diagnostico: paciData.diagnostico,
        fechaElaboracion: paciData.fechaElaboracion
          ? paciData.fechaElaboracion.split('/').reverse().join('-')
          : '',
        fechaRevision: paciData.fechaRevision
          ? paciData.fechaRevision.split('/').reverse().join('-')
          : '',
        duracion: paciData.duracion,
        validFrom: paciData.validFrom,
        validUntil: paciData.validUntil,
        datosEstructurales: paciData.datosEstructurales && Object.keys(paciData.datosEstructurales).length > 0
          ? paciData.datosEstructurales
          : { resumen: '' },
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

          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Curso Actual</label>
            <select
              name="cursoActual"
              value={studentData.cursoActual}
              onChange={handleStudentChange}
              required
              className="w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="" disabled>
                Selecciona un curso
              </option>
              {COURSE_OPTIONS.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sección PACI */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Datos del PACI</h3>
          
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Diagnostico</label>
            <select
              name="diagnostico"
              value={paciData.diagnostico}
              onChange={handlePaciChange}
              required
              className="w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="" disabled>
                Selecciona un diagnostico
              </option>
              {Object.entries(DIAGNOSIS_OPTIONS).map(([group, options]) => (
                <optgroup key={group} label={group}>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

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

          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Duracion (semestral)</label>
            <select
              name="duracion"
              value={paciData.duracion}
              onChange={handlePaciChange}
              required
              className="w-full rounded-lg border border-outline-variant/40 bg-surface px-3 py-2 text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="" disabled>
                Selecciona un semestre
              </option>
              {SEMESTER_OPTIONS.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Válido Desde"
              type="date"
              name="validFrom"
              value={paciData.validFrom}
              onChange={handlePaciChange}
              readOnly
              disabled
              required
            />

            <Input
              label="Válido Hasta"
              type="date"
              name="validUntil"
              value={paciData.validUntil}
              onChange={handlePaciChange}
              readOnly
              disabled
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
