export default function Field({ label, required = false, error, children, className = "" }:{
  label: string; 
  required?: boolean; // Opcional aqui
  error?: string; // Mensagem de erro exibida abaixo do campo
  children: React.ReactNode; 
  className?: string
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span aria-hidden>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}