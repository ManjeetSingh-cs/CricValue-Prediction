import axios from 'axios';
import { AIInsight, AIStrategyResponse, Player, PlayerAnalysis, PlayerTrend } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000',
});

export type PredictionInput = {
  runs: number;
  avg: number;
  strike_rate: number;
  wickets: number;
  economy: number;
  matches?: number;
  recent_form?: number;
  consistency?: number;
  form_trend?: number;
};

export type RegisterPlayerInput = {
  name: string;
  team: string;
  role: string;
  nationality: string;
  currentValue: number;
  predictedValue?: number;
  matches?: number;
  stats?: {
    batting?: {
      average?: number;
      strikeRate?: number;
      totalRuns?: number;
      runs?: number;
    };
    bowling?: {
      economy?: number;
      wickets?: number;
      average?: number;
    };
  };
  recentForm?: number[];
};

export const playerService = {
  getPlayers: async () => {
    const response = await api.get<Player[]>('/players');
    return response.data;
  },
  createPlayer: async (input: RegisterPlayerInput) => {
    const response = await api.post<{ success: boolean; message: string; player: Player }>('/players', input);
    return response.data;
  },
  getPlayer: async (name: string) => {
    const response = await api.get<Player>(`/player/${encodeURIComponent(name)}`);
    return response.data;
  },
  getPlayerCharts: async (name: string) => {
    const response = await api.get(`/player/${encodeURIComponent(name)}/charts`);
    return response.data;
  },
  getPlayerTrend: async (name: string) => {
    const response = await api.get<PlayerTrend>(`/player/${encodeURIComponent(name)}/trend`);
    return response.data;
  },
  getPlayerAnalysis: async (name: string) => {
    const response = await api.get<PlayerAnalysis>(`/player/${encodeURIComponent(name)}/analysis`);
    return response.data;
  },
  getBestXI: async () => {
    const response = await api.get('/best-xi');
    return response.data;
  },
  runAuction: async (budget: number, max_players = 11) => {
    const response = await api.post('/auction', { budget, max_players });
    return response.data;
  },
  getUndervaluedPlayers: async () => {
    const response = await api.get<Player[]>('/undervalued');
    return response.data;
  },
  comparePlayers: async (player_one: string, player_two: string) => {
    const response = await api.post('/compare', { player_one, player_two });
    return response.data;
  },
  predictValue: async (input: PredictionInput | string) => {
    const body = typeof input === 'string' ? { playerId: input } : input;
    const response = await api.post<{ predicted_value: number; predictedValue: number; confidence: number; reasoning: string }>('/predict', body);
    return response.data;
  },
  generateReport: async () => {
    const response = await api.get<Blob>('/generate-report', { responseType: 'blob' });
    return response.data;
  },
  analyzeStrategy: async (prompt: string, budget = 500) => {
    const response = await api.post<AIStrategyResponse>('/ai-strategy', { prompt, budget });
    return response.data;
  },
  getAIInsights: async () => {
    const response = await api.get<{ insights: AIInsight[] }>('/ai-insights');
    return response.data.insights;
  },
  scoutPlayers: async (query: string) => {
    const response = await api.post('/ai-scout', { query });
    return response.data;
  },
};
