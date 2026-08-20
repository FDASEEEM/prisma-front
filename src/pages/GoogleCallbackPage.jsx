/**
 * GoogleCallbackPage
 * Página que recibe los tokens tras el login de Google (fragment de la URL)
 * y completa la sesión del usuario.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components';
import { getHomePathForRole } from '../utils/roleNavigation';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    document.title = 'P.R.I.S.M.A. - Iniciando sesión';

    const params = new URLSearchParams(window.location.hash.slice(1));

    const oauthError = params.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      setTimeout(() => navigate('/login', { replace: true }), 2500);
      return;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    let user = null;
    try {
      user = JSON.parse(decodeURIComponent(params.get('user') || 'null'));
    } catch {
      user = null;
    }

    if (!accessToken || !user) {
      setError('No se pudo completar el inicio de sesión con Google.');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
      return;
    }

    login(user, {
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    navigate(getHomePathForRole(user.role), { replace: true });
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-8">
      <div className="text-center">
        {error ? (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        ) : (
          <>
            <Spinner />
            <p className="mt-4 text-on-surface-variant">
              Completando el inicio de sesión con Google...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;