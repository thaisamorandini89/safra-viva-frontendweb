export const colors = {
  primary: {
    default:  "bg-green-700",
    hover:    "hover:bg-green-800",
    text:     "text-green-700",
    border:   "border-green-700",
    light:    "bg-green-100",
    sidebar:  "bg-green-900",
    active:   "bg-green-600",
  },
  secondary: {
    default:  "bg-white",
    hover:    "hover:bg-gray-50",
    text:     "text-gray-600",
    border:   "border-gray-300",
  },
  danger: {
    default:  "bg-red-600",
    hover:    "hover:bg-red-700",
    text:     "text-red-600",
    border:   "border-red-600",
    light:    "bg-red-50",
  },
  ghost: {
    default:  "bg-transparent",
    hover:    "hover:bg-gray-100",
    text:     "text-gray-500",
    border:   "border-transparent",
  },
  background: {
    app:      "bg-gray-50",
    card:     "bg-white",
    sidebar:  "bg-green-900",
  },
  text: {
    primary:  "text-gray-800",
    secondary:"text-gray-500",
    muted:    "text-gray-400",
    onDark:   "text-white",
    success:  "text-green-700",
    danger:   "text-red-600",
  },
  border: {
    default:  "border-gray-200",
    strong:   "border-gray-300",
    focus:    "focus:ring-green-400",
  },
};

export const buttonVariants = {
  primary:
    `${colors.primary.default} ${colors.primary.hover} text-white border border-transparent`,
  secondary:
    `${colors.secondary.default} ${colors.secondary.hover} ${colors.secondary.text} border ${colors.secondary.border}`,
  danger:
    `${colors.danger.default} ${colors.danger.hover} text-white border border-transparent`,
  ghost:
    `${colors.ghost.default} ${colors.ghost.hover} ${colors.ghost.text} border ${colors.ghost.border}`,
};