export interface Player {
  id: string;
  name: string;
  team: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
  nationality: string;
  image?: string;
  stats: {
    batting: {
      matches: number;
      runs: number;
      average: number;
      strikeRate: number;
      highest: number;
    };
    bowling: {
      matches: number;
      wickets: number;
      economy: number;
      average: number;
      best: string;
    };
  };
  recentForm: number[]; // Last 5 scores/wickets
  predictedValue: number; // in Millions (₹ or generic currency)
  actualValue?: number;
  valuationTrend: { date: string; value: number }[];
  performanceTrend: { date: string; score: number }[];
  consistency?: number;
  formTrend?: number;
}

export interface AuctionSquad {
  players: Player[];
  budget: number;
  remainingBudget: number;
}

export interface PlayerAnalysis {
  player_name: string;
  performance_score: number;
  strengths: string[];
  weaknesses: string[];
  recent_trend: 'improving' | 'declining' | 'stable' | string;
  risk_level: 'low' | 'medium' | 'high' | string;
  trend_slope: number;
}

export interface PlayerTrend {
  player_name: string;
  last_5_matches: { date: string; score: number }[];
  trend_slope: number;
}

export interface AIInsight {
  headline: string;
  detail: string;
  confidence: number;
  type: 'alpha' | 'risk' | string;
}

export interface AIStrategyResponse {
  answer: string;
  confidence: number;
  generated_at: string;
  prompt: string;
  budget: number;
  best_xi: Player[];
  auction_plan: {
    budget: number;
    total_spent: number;
    remaining_budget: number;
    suggested_team: Player[];
  };
  undervalued: Player[];
  safe_players: string[];
  risky_players: string[];
  suggested_prompts: string[];
}
