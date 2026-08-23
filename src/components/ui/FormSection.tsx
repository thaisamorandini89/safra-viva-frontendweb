import SectionTitle from "./SectionTitle";

export default function FormSection({ title, cols = 3, className = "", children }) {
  // Responsivo: 1 coluna no mobile, 2 no tablet e o valor de `cols` no desktop (lg+)
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={className}>
      <SectionTitle>{title}</SectionTitle>
      <div className={`grid ${gridCols[cols]} gap-x-5 gap-y-4`}>
        {children}
      </div>
    </div>
  );
}