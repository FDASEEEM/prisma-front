/**
 * LoginPage
 * Página de autenticación
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Alert, Spinner } from '../components';
import authService from '../services/authService';
import { getHomePathForRole } from '../utils/roleNavigation';

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
      navigate(getHomePathForRole(response.user?.role));
    } catch (error) {
      setApiError(error.message || 'Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setApiError(null);
    setIsLoading(true);

    try {
      const url = await authService.getGoogleAuthUrl();
      if (!url) {
        throw new Error('No se pudo obtener la URL de Google');
      }
      window.location.href = url;
    } catch (error) {
      setApiError(error.message || 'Error al iniciar sesión con Google.');
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
            <div className="mb-8 text-center">
              <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">Bienvenido de vuelta</h3>
              <p className="font-body text-on-surface-variant">Accede a tu escritorio educativo</p>
            </div>

            {/* Error Alert */}
            {apiError && (
              <Alert variant="error" className="mb-6">
                {apiError}
              </Alert>
            )}

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-outline-variant/30 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-medium text-gray-700">Continuar con Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 border-t border-outline-variant/20"></div>
              <span className="text-sm text-on-surface-variant whitespace-nowrap">o ingresa con correo</span>
              <div className="flex-1 border-t border-outline-variant/20"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
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
                className="mt-6"
              >
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
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
