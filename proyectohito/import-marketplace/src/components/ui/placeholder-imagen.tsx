/**
 * Placeholder local para productos sin imagen: el prototipo nunca depende
 * de la red para mostrar el catálogo.
 */
export function PlaceholderImagen({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 ${className ?? ""}`}
      role="img"
      aria-label="Producto sin imagen"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-slate-400"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.5-3.5a1.5 1.5 0 0 0-2 0L6 21" />
      </svg>
    </div>
  );
}
