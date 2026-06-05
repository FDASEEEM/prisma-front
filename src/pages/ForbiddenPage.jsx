import { Link } from 'react-router-dom';

const ForbiddenPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="max-w-lg rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-error">403 Forbidden</p>
        <h1 className="mt-4 text-3xl font-bold text-on-surface">No tienes permisos para entrar aquí</h1>
        <p className="mt-3 text-on-surface-variant">
          Esta sección está reservada exclusivamente para usuarios con rol ADMIN.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 font-medium text-on-primary transition-colors hover:opacity-90"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default ForbiddenPage;