import axios from 'axios';
import { Player } from '../types';

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

export const playerService = {
  async getPlayers() {
    const response = await api.get<Player[]>('/players');
    return response.data;
  },

  async getPlayer(name: string) {
    const response = await api.get<Player>(`/player/${encodeURIComponent(name)}`);
    return response.data;
  },

  async getPlayerCharts(name: string) {
    const response = await api.get(`/player/${encodeURIComponent(name)}/charts`);
    return response.data;
  },

  async getPlayerTrend(name: string) {
    const response = await api.get(`/player/${encodeURIComponent(name)}/trend`);
    return response.data;
  },

  async getBestXI() {
    const response = await api.get('/best-xi');
    return response.data;
  },

  async runAuction(budget: number, max_players = 11) {
    const response = await api.post('/auction', { budget, max_players });
    return response.data;
  },

  async getUndervaluedPlayers() {
    const response = await api.get<Player[]>('/undervalued');
    return response.data;
  },

  async comparePlayers(player_one: string, player_two: string) {
    const response = await api.post('/compare', { player_one, player_two });
    return response.data;
  },

  async predictValue(input: PredictionInput) {
    const response = await api.post('/predict', input);
    return response.data;
  },

  async predictExistingPlayer(playerId: string) {
    const response = await api.post('/predict', { playerId });
    return response.data;
  },
};
