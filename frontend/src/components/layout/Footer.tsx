// src/components/layout/Footer.tsx
// Site footer with navigation links

import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-dark-800 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-dark-500 text-sm">
            Squad Karma - Community project, not affiliated with OWI
          </p>
          <div className="flex items-center gap-4 text-sm text-dark-500">
            <Link to="/about" className="hover:text-dark-300 transition-colors">
              About
            </Link>
            <Link to="/privacy" className="hover:text-dark-300 transition-colors">
              Privacy
            </Link>
            <a 
              href="https://github.com/Metroseksuaali/SquadKarma" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-dark-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
