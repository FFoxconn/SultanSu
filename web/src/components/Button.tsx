import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant = "primary", loading = false, icon, children, className, disabled, ...rest }: Props) {
  const variantClass = variant === "primary" ? "" : variant;
  return (
    <button className={`${variantClass} btn-with-icon ${className ?? ""}`} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner size={15} /> : icon}
      {children}
    </button>
  );
}
