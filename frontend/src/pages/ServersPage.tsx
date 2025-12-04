// src/pages/ServersPage.tsx
// Server list and player selection

import { useServers } from '@/hooks/useServers';
import { Server, Users } from 'lucide-react';

export function ServersPage() {
  const { data: servers, isLoading, error } = useServers();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Failed to load servers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Servers</h1>
      <p className="text-dark-400">Select a server to view players and give reputation</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers?.map((server) => (
          <div key={server.id} className="card hover:border-primary-500/50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{server.name}</h3>
                  <p className="text-sm text-dark-400">{server.ip}:{server.port}</p>
                </div>
              </div>
              {server.playerCount !== undefined && (
                <div className="flex items-center gap-1 text-dark-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{server.playerCount}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {servers?.length === 0 && (
          <div className="col-span-full text-center py-8 text-dark-400">
            No servers available
          </div>
        )}
      </div>
    </div>
  );
}
