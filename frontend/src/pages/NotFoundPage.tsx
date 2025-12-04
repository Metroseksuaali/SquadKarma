// src/pages/NotFoundPage.tsx
// 404 page

import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-dark-600 mb-4">404</h1>
      <p className="text-xl text-dark-400 mb-8">Page not found</p>
      <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
