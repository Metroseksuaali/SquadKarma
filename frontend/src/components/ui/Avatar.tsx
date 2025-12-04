// src/components/ui/Avatar.tsx
import { cn } from '@/utils/cn';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt = 'Avatar', size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  if (!src) {
    return (
      <div
        className={cn(
          'rounded-full bg-dark-700 flex items-center justify-center text-dark-400',
          sizes[size],
          className
        )}
      >
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('rounded-full object-cover', sizes[size], className)}
    />
  );
}
