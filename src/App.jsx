/**
 * App.jsx
 * Componente principal con routing
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import PACIPage from './pages/PACIPage';
import AjustadorPage from './pages/AjustadorPage';
import NuevaSesionPage from './pages/NuevaSesionPage';
import SesionPage from './pages/SesionPage';

/**
 * ProtectedRoute
 * Componente para proteger rutas que requieren autenticación
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * AppContent
 * Contenedor de rutas (separado de App para poder usar useAuth hook)
 */
const AppContent = () => {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paci"
        element={
          <ProtectedRoute>
            <PACIPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ajustador"
        element={
          <ProtectedRoute>
            <AjustadorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nueva-sesion"
        element={
          <ProtectedRoute>
            <NuevaSesionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sesion/:sessionId"
        element={
          <ProtectedRoute>
            <SesionPage />
          </ProtectedRoute>
        }
      />

      {/* Ruta por defecto - lleva al login; ProtectedRoute decide si entra al dashboard */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

/**
 * App
 * Componente principal con providers
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
