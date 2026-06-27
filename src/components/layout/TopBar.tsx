export default function TopBar({ breadcrumb, page }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <div className="text-sm text-gray-500">
        <span className="text-gray-400">{breadcrumb}</span>
        <span className="mx-1 text-gray-300">›</span>
        <span className="font-semibold text-gray-700">{page}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>📅 15 de Maio de 2024</span>
        <span className="relative">
          🔔
          <span className="absolute -top-1 -right-1 bg-orange-400 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            3
          </span>
        </span>
        <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer">
          👤
        </span>
      </div>
    </div>
  );
}
