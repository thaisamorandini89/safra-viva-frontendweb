import { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonVariants } from "../../theme";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
}

export default function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}