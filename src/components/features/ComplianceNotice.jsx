/**
 * ComplianceNotice
 * Muestra (a) el bloqueo normativo del flujo de forma destacada y distinta de un
 * error genérico de servidor, y (b) las advertencias no bloqueantes del evaluador.
 */
const ComplianceNotice = ({ blocked = false, reason = '', warnings = [] }) => {
  if (!blocked && (!warnings || warnings.length === 0)) return null;

  return (
    <div className="flex flex-col gap-3 w-full">
      {blocked && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-800 rounded-2xl p-4 text-sm text-orange-900 dark:text-orange-300">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">gavel</span>
            Documento no conforme a normativa
          </p>
          <p>{reason || 'El documento no cumple los requisitos normativos y el proceso fue detenido.'}</p>
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">info</span>
            Advertencias del evaluador
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComplianceNotice;
