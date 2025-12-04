// src/components/layout/Header.tsx
// Navigation header

import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Search, LogIn, LogOut, User } from 'lucide-react';

export function Header() {
  const { user, isLoggedIn, login, logout } = useAuth();

  return (
    <header className="bg-dark-800 border-b border-dark-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-500">Squad</span>
            <span className="text-2xl font-bold text-dark-100">Karma</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/servers" className="text-dark-300 hover:text-dark-100 transition-colors">
              Servers
            </Link>
            <Link to="/search" className="text-dark-300 hover:text-dark-100 transition-colors">
              <Search className="w-5 h-5" />
            </Link>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 text-dark-400" />
                  )}
                  <span className="text-dark-200 hidden sm:inline">{user?.displayName}</span>
                </div>
                <button
                  onClick={logout}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="btn btn-primary flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Steam
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
