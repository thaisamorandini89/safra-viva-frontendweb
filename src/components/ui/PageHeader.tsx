import { colors } from "../../theme";

export default function PageHeader({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className={`text-xl font-bold ${colors.text.primary}`}>{title}</h2>
      {description && (
        <p className={`text-sm ${colors.text.muted} mt-1`}>{description}</p>
      )}
    </div>
  );
}