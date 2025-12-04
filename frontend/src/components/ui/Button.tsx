// src/components/ui/Button.tsx
// Reusable button component

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary-600 hover:bg-primary-700 text-white': variant === 'primary',
            'bg-dark-700 hover:bg-dark-600 text-dark-100': variant === 'secondary',
            'bg-red-600 hover:bg-red-700 text-white': variant === 'danger',
            'hover:bg-dark-700 text-dark-300': variant === 'ghost',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
