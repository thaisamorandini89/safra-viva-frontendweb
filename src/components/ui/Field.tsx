export default function Field({ label, required = false, children, className = "" }:{
  label: string; 
  required?: boolean; // Opcional aqui
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
    </div>
  );
}