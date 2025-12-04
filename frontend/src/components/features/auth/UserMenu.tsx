// src/components/features/auth/UserMenu.tsx
import { useState, useRef, useEffect } from 'react';
import { Avatar, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export function UserMenu() {
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-dark-700 animate-pulse" />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-dark-800 transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <Avatar src={user.avatarUrl} alt={user.displayName} size="md" />
        <span className="hidden sm:block text-sm font-medium text-dark-100 max-w-32 truncate">
          {user.displayName}
        </span>
        <ChevronIcon className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-dark-700">
            <p className="text-sm font-medium text-dark-100 truncate">{user.displayName}</p>
            <p className="text-xs text-dark-400 font-mono">{user.steam64}</p>
          </div>
          
          <div className="py-1">
            <a
              href={`/player/${user.steam64}`}
              className="block px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 hover:text-dark-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              My Reputation
            </a>
          </div>

          <div className="border-t border-dark-700 py-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full justify-start px-4 text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <LogoutIcon className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
