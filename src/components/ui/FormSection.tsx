import SectionTitle from "./SectionTitle";

export default function FormSection({ title, cols = 3, className = "", children }) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
  };

  return (
    <div className={className}>
      <SectionTitle>{title}</SectionTitle>
      <div className={`grid ${gridCols[cols]} gap-3`}>
        {children}
      </div>
    </div>
  );
}