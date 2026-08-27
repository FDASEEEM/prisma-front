/**
 * NoColegioNotice
 * Aviso amable para el docente autenticado que todavía no tiene un colegio
 * asignado. Reemplaza el 403 crudo en las pantallas de estudiantes / PACI.
 *
 * Usa los tokens del tema de la app (sin variantes `dark:`) para garantizar
 * contraste: tarjeta clara + texto oscuro + acento primario.
 */
const NoColegioNotice = ({ message }) => (
  <div className="bg-surface-container-low border-l-4 border-primary rounded-2xl p-6 md:p-8 max-w-2xl mx-auto text-center shadow-sm">
    <span className="material-symbols-outlined text-5xl text-primary">
      school
    </span>
    <h2 className="mt-3 font-headline text-xl text-on-surface">
      Tu cuenta aún no está asignada a un colegio
    </h2>
    <p className="mt-2 text-sm md:text-base text-on-surface-variant">
      {message ||
        'Contacta a un administrador para que te asigne a un colegio. Una vez asignado podrás gestionar estudiantes y perfiles PACI.'}
    </p>
  </div>
);

export default NoColegioNotice;
