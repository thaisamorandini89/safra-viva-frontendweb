export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <circle cx="20" cy="20" r="18" fill="#166534" />
          <path d="M20 8 C14 14 10 20 14 26 C18 32 26 30 28 24 C30 18 26 12 20 8Z" fill="#4ade80" opacity="0.8" />
          <path d="M20 8 C26 14 30 20 26 26 C22 32 14 30 12 24 C10 18 14 12 20 8Z" fill="#86efac" opacity="0.6" />
          <circle cx="20" cy="22" r="4" fill="#fff" opacity="0.9" />
        </svg>
      </div>
      <div>
        <div className="text-white font-bold text-lg leading-none tracking-wide">SafraViva</div>
        <div className="text-green-300 text-xs leading-none mt-0.5">Inteligência para o Campo & Pecuária</div>
      </div>
    </div>
  );
}