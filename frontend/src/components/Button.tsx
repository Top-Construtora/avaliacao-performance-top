import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  icon,
}: ButtonProps) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background hover:-translate-y-0.5 hover:shadow-md font-lemon-milk tracking-wide';

  // gio v4.0: primary = CTA lime (assinatura); demais via tokens de status/grafite.
  const variantClasses = {
    primary: 'bg-lime text-obsidian hover:bg-lime-deep focus:ring-lime/50',
    secondary: 'bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary/50',
    success: 'bg-success text-white hover:opacity-90 focus:ring-success/50',
    danger: 'bg-destructive text-destructive-foreground hover:opacity-90 focus:ring-destructive/50',
    warning: 'bg-warning text-obsidian hover:opacity-90 focus:ring-warning/50',
    outline:
      'border-2 border-border bg-card text-foreground hover:border-lime hover:text-lime-deep dark:hover:text-lime focus:ring-lime/50',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none'
    : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${disabledClasses}
        ${className}
      `}
    >
      {icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

export default Button;
