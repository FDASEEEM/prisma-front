/**
 * LoginPage
 * Página de autenticación
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Alert, Spinner } from '../components';
import authService from '../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    document.title = 'P.R.I.S.M.A. - Iniciar Sesión';
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Correo inválido';
    }
    
    if (!password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(email, password);
      login(response.user, response.tokens);
      navigate(response.user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (error) {
      setApiError(error.message || 'Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side: Editorial Canvas (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-surface-container-low to-primary-container p-16 flex-col justify-between overflow-hidden">
        {/* Abstract Shapes */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-[30rem] h-[30rem] bg-secondary-container opacity-10 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="relative z-10">
          <h2 className="font-headline font-bold text-3xl text-primary tracking-tight mb-2">P.R.I.S.M.A.</h2>
          <p className="text-on-surface-variant italic text-lg">Modelo Agéntico con 4 IAs</p>
        </div>

        <div className="relative z-10 max-w-lg mt-auto mb-32">
          <h1 className="font-headline font-extrabold text-6xl text-on-primary-fixed leading-tight mb-8">
            Cultivando el aprendizaje <br />
            <span className="text-primary">personalizado.</span>
          </h1>
          <p className="font-body text-xl text-on-surface-variant leading-relaxed mb-12">
            Simplificamos la administración para que puedas enfocarte en lo que realmente importa: inspirar en el aula.
          </p>
          <div className="flex items-center space-x-4 bg-surface-container-lowest/60 backdrop-blur-md p-6 rounded-xl border border-outline-variant/15 w-max">
            <span className="material-symbols-outlined text-primary text-3xl fill-icon">eco</span>
            <div>
              <p className="font-body font-medium text-on-surface">Compatible con Formulario PACI</p>
              <p className="font-body text-sm text-on-surface-variant">Alineado al Decreto 83 del Ministerio de Educación</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-on-surface-variant">
          © 2026 P.R.I.S.M.A Team. Diseño para educadores de Chile. Todos los derechos reservados
        </div>
      </div>

      {/* Right Side: Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/logos/prisma_gif_logo.gif" 
              alt="P.R.I.S.M.A. Logo" 
              className="w-20 h-20 mx-auto"
            />
          </div>

          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-12">
            <h2 className="font-headline font-bold text-3xl text-primary tracking-tight">P.R.I.S.M.A.</h2>
            <p className="text-on-surface-variant italic mt-2">Modelo Agéntico con 4 IAs</p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0_20px_60px_-15px_rgba(35,26,7,0.06)] border border-outline-variant/15">
            {/* Header */}
            <div className="mb-10 text-center">
              <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">Bienvenido de vuelta</h3>
              <p className="font-body text-on-surface-variant">Ingresa tus credenciales para acceder a tu escritorio.</p>
            </div>

            {/* Error Alert */}
            {apiError && (
              <Alert variant="error" className="mb-6">
                {apiError}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="ejemplo@escuela.cl"
                icon="mail"
                iconPosition="left"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                error={errors.email}
              />

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-on-surface">Contraseña</label>
                  <a href="#" className="text-sm text-primary hover:text-on-primary-container transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  icon="lock"
                  iconPosition="left"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  error={errors.password}
                />
              </div>

              {/* CTA Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={isLoading}
                className="mt-8"
              >
                {isLoading ? 'Ingresando...' : 'Ingresar a mi Aula'}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-on-surface-variant">
                ¿No tienes una cuenta?{' '}
                <a href="#" className="text-primary font-semibold hover:text-on-primary-container transition-colors underline decoration-primary/30 hover:decoration-primary underline-offset-4">
                  Solicitar acceso institucional
                </a>
              </p>
            </div>
          </div>

          {/* Footer for Mobile */}
          <div className="lg:hidden mt-12 text-center text-sm text-on-surface-variant">
            <p>Sistema PACI Chileno</p>
            <p>Ministerio de Educación</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
