// src/pages/PlayerPage.tsx
// Player profile and reputation

import { useParams } from 'react-router-dom';
import { useReputation } from '@/hooks/useReputation';
import { ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';
import { formatRatio } from '@/utils/format';

export function PlayerPage() {
  const { steam64 } = useParams<{ steam64: string }>();
  const { data: reputation, isLoading, error } = useReputation(steam64 || '');

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !reputation) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Player not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Player Header */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-500">
              {reputation.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{reputation.displayName}</h1>
            <p className="text-dark-400 font-mono text-sm">{steam64}</p>
          </div>
        </div>
      </div>

      {/* Reputation Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card text-center">
          <ThumbsUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-green-500">{reputation.summary.totalUp}</p>
          <p className="text-dark-400">Positive</p>
        </div>
        <div className="card text-center">
          <ThumbsDown className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-red-500">{reputation.summary.totalDown}</p>
          <p className="text-dark-400">Negative</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="w-8 h-8 text-primary-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-primary-500">{formatRatio(reputation.summary.ratio)}</p>
          <p className="text-dark-400">Positive Rate</p>
        </div>
      </div>

      {/* Top Categories */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Top Categories</h2>
        <div className="space-y-3">
          {reputation.topCategories.map((category) => (
            <div key={category.name} className="flex items-center justify-between">
              <span className={
                category.type === 'POSITIVE' ? 'text-green-400' :
                category.type === 'NEGATIVE' ? 'text-red-400' : 'text-dark-300'
              }>
                {category.name}
              </span>
              <span className="text-dark-400">{category.count} votes</span>
            </div>
          ))}
          {reputation.topCategories.length === 0 && (
            <p className="text-dark-400">No categories yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
