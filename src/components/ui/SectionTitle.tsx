export default function SectionTitle({ children }) {
  return (
    <h3 className="text-green-700 font-bold text-sm mb-4 mt-8 first:mt-0 pb-2 border-b border-green-100">
      {children}
    </h3>
  );
}