// src/pages/SearchPage.tsx
// Player search page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { playersService } from '@/services/players.service';
import type { Player } from '@/types';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const players = await playersService.searchPlayers(query);
      setResults(players);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Search Players</h1>
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or Steam64 ID..."
            className="input w-full pl-10"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Results */}
      <div className="space-y-2">
        {results.map((player) => (
          <div
            key={player.steam64}
            onClick={() => navigate(`/player/${player.steam64}`)}
            className="card hover:border-primary-500/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{player.lastKnownName}</p>
                <p className="text-sm text-dark-400 font-mono">{player.steam64}</p>
              </div>
            </div>
          </div>
        ))}

        {results.length === 0 && query && !isSearching && (
          <p className="text-center text-dark-400 py-8">No players found</p>
        )}
      </div>
    </div>
  );
}
