// src/components/layout/Footer.tsx
// Site footer

export function Footer() {
  return (
    <footer className="bg-dark-800 border-t border-dark-700 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-dark-400 text-sm">
            Squad Karma - Community project, not affiliated with OWI
          </p>
          <div className="flex items-center gap-4 text-sm text-dark-400">
            <a href="#" className="hover:text-dark-200 transition-colors">
              About
            </a>
            <a href="#" className="hover:text-dark-200 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-dark-200 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
