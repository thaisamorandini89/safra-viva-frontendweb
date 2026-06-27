import { buttonVariants } from "../../theme";

export default function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-lg transition ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}