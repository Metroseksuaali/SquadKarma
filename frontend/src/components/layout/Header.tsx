// src/components/layout/Header.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SteamLoginButton, UserMenu } from '@/components/features/auth';

export function Header() {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/servers', label: 'Servers' },
    { href: '/search', label: 'Search' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur border-b border-dark-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <KarmaIcon className="w-8 h-8 text-primary-500 group-hover:text-primary-400 transition-colors" />
            <span className="text-xl font-bold text-dark-100">
              Squad<span className="text-primary-500">Karma</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'bg-dark-800 text-primary-400'
                    : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth section */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-dark-700 animate-pulse" />
            ) : isLoggedIn ? (
              <UserMenu />
            ) : (
              <SteamLoginButton size="sm" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function KarmaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}
