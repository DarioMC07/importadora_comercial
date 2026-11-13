/**
 * Placeholder local para productos sin imagen: el prototipo nunca depende
 * de la red para mostrar el catálogo.
 */
export function PlaceholderImagen({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-slate-100 ${className ?? ""}`}
      role="img"
      aria-label="Producto sin imagen"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-10 w-10 text-slate-300"
        aria-hidden="true"
      >
        <path d="M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10 M7.5 5l9 4" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
