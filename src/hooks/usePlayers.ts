import { useState, useEffect } from 'react';
import { Player } from '@/types';
import { playerService } from '@/services/api';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await playerService.getPlayers();
      setPlayers(data);
    } catch (err) {
      setError('Failed to fetch players from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  return { players, loading, error, refetch: fetchPlayers };
}
