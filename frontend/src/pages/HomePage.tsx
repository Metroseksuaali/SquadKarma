// src/pages/HomePage.tsx
// Landing page

import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SteamLoginButton } from '@/components/features/auth';
import { ThumbsUp, Shield, Users } from 'lucide-react';

export function HomePage() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-6">
          <span className="text-primary-500">Squad</span>
          <span className="text-dark-100"> Karma</span>
        </h1>
        <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
          Community-driven reputation system for Squad players. 
          Rate players, build trust, improve the community.
        </p>
        
        {isLoggedIn ? (
          <Link to="/servers" className="btn btn-primary text-lg px-8 py-3">
            Browse Servers
          </Link>
        ) : (
          <SteamLoginButton size="lg" />
        )}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-6 h-6 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Rate Players</h3>
          <p className="text-dark-400">
            Give thumbs up or down with specific reason categories
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Build Trust</h3>
          <p className="text-dark-400">
            See player reputation before joining their squad
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
          <p className="text-dark-400">
            By players, for players. Not affiliated with OWI.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500 mb-2">1</div>
            <p className="text-dark-300">Sign in with your Steam account</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500 mb-2">2</div>
            <p className="text-dark-300">Select a server and find a player</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500 mb-2">3</div>
            <p className="text-dark-300">Give thumbs up/down with a reason</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500 mb-2">4</div>
            <p className="text-dark-300">Help build a better community</p>
          </div>
        </div>
      </section>
    </div>
  );
}
