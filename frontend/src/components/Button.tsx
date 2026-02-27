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
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:-translate-y-0.5 hover:shadow-md font-lemon-milk tracking-wide';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#1e6076] to-[#12b0a0] hover:from-[#1a5a6b] hover:to-[#0f9d8a] text-white focus:ring-[#12b0a0]/50',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500',
    outline: 'border-2 border-[#1e6076] bg-white text-[#1e6076] hover:bg-[#12b0a0]/5 hover:border-[#12b0a0] hover:text-[#12b0a0] focus:ring-[#12b0a0]/50',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none' : '';
  
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