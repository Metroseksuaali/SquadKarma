// src/components/layout/Layout.tsx
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-dark-900 border-t border-dark-800 py-6">
        <div className="container mx-auto px-4 text-center text-dark-500 text-sm">
          <p>Squad Karma is a community project. Not affiliated with OWI.</p>
        </div>
      </footer>
    </div>
  );
}
