/**
 * Profile Page
 * Página para ver y editar perfil del docente
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MainContainer from '../components/layout/MainContainer';
import { Card, Button, Input, Alert, Modal, Badge } from '../components/ui';
import authService from '../services/authService';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rut: '',
    institucion: '',
    especialidad: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  useEffect(() => {
    document.title = 'P.R.I.S.M.A. - Usuario';
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        rut: user.rut || '',
        institucion: user.institucion || '',
        especialidad: user.especialidad || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // En producción, llamar a:
      // await authService.updateProfile(formData);
      
      // Por ahora, actualizar el contexto directamente
      updateUser(formData);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
    } catch (err) {
      setError('Error al cerrar sesión');
    }
  };

  return (
    <MainContainer>
      <div className="max-w-3xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 font-headline">
            Mi Perfil
          </h1>
          <p className="text-gray-600 mt-2 font-body">
            Actualiza tu información personal y credenciales
          </p>
        </div>

        {/* Alerts */}
        {success && (
          <Alert variant="success">
            ✓ Perfil actualizado correctamente
          </Alert>
        )}
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Profile Form */}
        <Card>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Nombre */}
            <Input
              label="Nombre Completo"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Tu nombre completo"
              required
            />

            {/* Email */}
            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="tu@email.com"
              disabled
            />

            {/* RUT */}
            <Input
              label="RUT"
              name="rut"
              type="text"
              value={formData.rut}
              onChange={handleInputChange}
              placeholder="XX.XXX.XXX-X"
              disabled
            />

            {/* Institución */}
            <Input
              label="Institución Educativa"
              name="institucion"
              type="text"
              value={formData.institucion}
              onChange={handleInputChange}
              placeholder="Nombre del colegio o institución"
            />

            {/* Especialidad */}
            <Input
              label="Especialidad / Materia"
              name="especialidad"
              type="text"
              value={formData.especialidad}
              onChange={handleInputChange}
              placeholder="e.g., Matemáticas, Lenguaje, etc."
            />

            {/* Save Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </Card>

        {/* Account Settings */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 font-headline">
            Configuración de Cuenta
          </h2>

          {/* Change Password Section */}
          <Card variant="outlined">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Cambiar Contraseña</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Actualiza tu contraseña regularmente para mantener tu cuenta segura
                </p>
              </div>
              <Button variant="outline">
                Cambiar
              </Button>
            </div>
          </Card>

          {/* Two-Factor Auth Section */}
          <Card variant="outlined">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Autenticación de Dos Factores</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Añade una capa extra de seguridad a tu cuenta
                </p>
              </div>
              <Badge variant="warning">Desactivado</Badge>
            </div>
          </Card>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 border-t-2 border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-red-600 font-headline">
            Zona de Peligro
          </h2>

          {/* Logout */}
          <Card variant="outlined" className="border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Cerrar Sesión</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Cierra tu sesión en todos tus dispositivos
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowConfirmLogout(true)}
              >
                Cerrar Sesión
              </Button>
            </div>
          </Card>

          {/* Delete Account */}
          <Card variant="outlined" className="border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Eliminar Cuenta</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Eliminar tu cuenta y todos tus datos asociados de forma permanente
                </p>
              </div>
              <Button variant="danger" disabled>
                Eliminar Cuenta
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirm Logout Modal */}
      <Modal
        isOpen={showConfirmLogout}
        onClose={() => setShowConfirmLogout(false)}
        title="Confirmar Cierre de Sesión"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas cerrar sesión?
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmLogout(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleLogout}
              className="flex-1"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </Modal>
    </MainContainer>
  );
};

export default ProfilePage;
