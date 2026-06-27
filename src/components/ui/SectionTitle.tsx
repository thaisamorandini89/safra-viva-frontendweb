export default function SectionTitle({ children }) {
  return (
    <h3 className="text-green-700 font-bold text-sm mb-3 mt-5 first:mt-0 pb-1 border-b border-green-100">
      {children}
    </h3>
  );
}