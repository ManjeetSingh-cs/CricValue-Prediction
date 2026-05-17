import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Bot, BrainCircuit, Download, MessageSquare, Send, Sparkles, TrendingUp, X, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePlayers } from '@/hooks/usePlayers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { playerService } from '@/services/api';
import { AIInsight, AIStrategyResponse } from '@/types';

export default function Dashboard() {
  const { players, loading } = usePlayers();
  const [reportLoading, setReportLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyPrompt, setStrategyPrompt] = useState('Analyze current market and recommend auction strategy');
  const [strategy, setStrategy] = useState<AIStrategyResponse | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  const topPlayers = [...players].sort((a, b) => b.predictedValue - a.predictedValue).slice(0, 3);
  const marketCap = useMemo(() => players.reduce((sum, player) => sum + player.predictedValue, 0), [players]);
  const avgValue = players.length ? marketCap / players.length : 0;
  const topGainer = topPlayers[0]?.name ?? 'N/A';
  
  const chartData = players.length > 0 ? players[0].valuationTrend : [];

  useEffect(() => {
    playerService.getAIInsights()
      .then(setInsights)
      .catch(() => setInsights([]));
  }, []);

  useEffect(() => {
    if (!insights.length) return;
    const timer = window.setInterval(() => {
      setInsights(current => [...current.slice(1), current[0]]);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [insights.length]);

  const downloadReport = async () => {
    setReportLoading(true);
    setToast(null);
    try {
      const blob = await playerService.generateReport();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cricvalue-global-report.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
      setToast('Global AI report generated successfully.');
    } catch (err) {
      setToast('Report generation failed. Check backend connection.');
    } finally {
      setReportLoading(false);
    }
  };

  const runStrategy = async (prompt = strategyPrompt) => {
    setStrategyOpen(true);
    setStrategyLoading(true);
    setStrategyPrompt(prompt);
    try {
      const response = await playerService.analyzeStrategy(prompt, 500);
      setStrategy(response);
    } catch (err) {
      setStrategy({
        answer: 'AI strategy service is unavailable. Verify FastAPI is running and try again.',
        confidence: 0,
        generated_at: new Date().toISOString(),
        prompt,
        budget: 500,
        best_xi: [],
        auction_plan: { budget: 500, total_spent: 0, remaining_budget: 500, suggested_team: [] },
        undervalued: [],
        safe_players: [],
        risky_players: [],
        suggested_prompts: [],
      });
    } finally {
      setStrategyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20"
    >
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">AI Auction Terminal <span className="text-sm font-normal text-slate-400 ml-2">Hedge-fund intelligence for cricket assets</span></h2>
        <div className="flex items-center gap-4">
           <div className="flex -space-x-2">
              {topPlayers.map((p, i) => (
                <div key={p.id} className="w-8 h-8 rounded-full border-2 border-background bg-slate-800 flex items-center justify-center text-[10px] font-bold" style={{ zIndex: 10 - i }}>
                   {p.name.charAt(0)}
                </div>
              ))}
           </div>
           <p className="text-xs text-slate-400">Tracked Assets: <span className="text-white font-bold">{players.length}</span></p>
        </div>
      </header>

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-xl border border-indigo-500/30 bg-[#0f172a] px-5 py-3 text-sm text-indigo-100 shadow-2xl shadow-indigo-900/40">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-indigo-500/20 bg-[#0f172a] p-6 shadow-xl shadow-indigo-950/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-400"></span>
            </span>
            <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold">Autonomous AI Insights Feed</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(insights.length ? insights.slice(0, 4) : [
              { headline: 'Loading live intelligence', detail: 'AI desk is scanning valuation, risk, and auction premium signals.', confidence: 0.7, type: 'alpha' },
            ]).map((insight, index) => (
              <div key={`${insight.headline}-${index}`} className="border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-white">{insight.headline}</p>
                  <Badge className={cn("border", insight.type === 'alpha' ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20")}>
                    {Math.round(insight.confidence * 100)}%
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-slate-800 bg-[#0f172a] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-5 h-5 text-indigo-300" />
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">AI Strategy Copilot</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">Ask the system to simulate auctions, detect hidden alpha, explain valuation changes, and recommend budget allocation.</p>
          </div>
          <Button onClick={() => runStrategy()} className="mt-6 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
            <MessageSquare className="w-4 h-4 mr-2" />
            Open Strategy AI
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'MODEL MARKET CAP', value: `₹${Math.round(marketCap)}M`, detail: '+12%', positive: true },
          { label: 'AVG PLAYER VALUE', value: `₹${avgValue.toFixed(1)}M`, detail: 'LIVE', positive: null },
          { label: 'TOP AI ASSET', value: topGainer, detail: '+EV', positive: true },
          { label: 'AI CONFIDENCE', value: '88%', detail: 'ACTIVE', positive: null },
        ].map((stat, idx) => (
          <div key={idx} className={cn(
            "bg-slate-900/50 border border-slate-800 p-5 rounded-2xl",
            idx === 3 && "bg-gradient-to-br from-indigo-900/20 to-transparent"
          )}>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stat.value}</span>
              {stat.positive !== null && (
                <span className={cn(
                  "text-xs font-medium",
                  stat.positive ? "text-emerald-500" : "text-rose-500"
                )}>
                  {stat.detail}
                </span>
              )}
              {stat.positive === null && (
                <span className="text-indigo-400 text-[10px] font-bold">{stat.detail}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-grow grid grid-cols-12 gap-6">
        {/* Top Valuations Table */}
        <div className="col-span-12 lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl shadow-black/20">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
            <h3 className="font-bold text-white">Top Valuation Forecast</h3>
            <Button variant="ghost" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 h-auto p-0">View All Players</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-4 font-bold">Player</th>
                  <th className="px-6 py-4 text-center font-bold">Role</th>
                  <th className="px-6 py-4 text-right font-bold">Predicted Index</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-300 font-medium">
                {players.slice(0, 5).map((player) => (
                  <tr key={player.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-500 to-indigo-300 flex items-center justify-center text-[10px] font-bold text-white">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{player.name}</p>
                        <p className="text-[10px] text-slate-500">{player.team}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-800 text-[10px] text-slate-400 rounded-md border border-slate-700">
                        {player.role.substring(0, 3).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-emerald-400 font-bold tracking-tight">₹{player.predictedValue}M</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Trends Chart */}
        <div className="col-span-12 lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-2xl flex flex-col p-6 shadow-xl shadow-black/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">Market Volatility</h3>
            <Badge variant="outline" className="border-slate-800 text-[10px] text-slate-500 uppercase h-6">Live Feed</Badge>
          </div>
          <div className="flex-grow flex flex-col gap-6">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#indigoGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-xs text-slate-400 font-medium">Performance Index</span>
                </div>
                <span className="text-xs font-bold text-white">+14.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  <span className="text-xs text-slate-400 font-medium">Sentiment Analysis</span>
                </div>
                <span className="text-xs font-bold text-white">Aggressive</span>
              </div>
              <Button
                onClick={downloadReport}
                disabled={reportLoading}
                className="w-full mt-4 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                {reportLoading ? "Generating AI Report..." : "Download Global Report"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Insight */}
      <div className="mt-8 rounded-3xl bg-gradient-to-br from-indigo-900/20 via-indigo-900/5 to-transparent p-1">
        <div className="bg-[#0f172a] h-full w-full rounded-[calc(1.5rem-5px)] p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-500/10">
          <div className="space-y-4 max-w-xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">AI Insight</span>
             </div>
             <h3 className="text-2xl font-bold text-white">Expect a Market Correction in "Batsmen" Category</h3>
             <p className="text-slate-400">Historical data suggests that after Q2, top-order batsmen valuation tends to stabilize by 8-12% as bowing averages improve on worn tracks.</p>
          </div>
          <Button onClick={() => runStrategy('Analyze strategy for this market correction and suggest auction moves')} size="lg" className="rounded-xl px-8 bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze Strategy
          </Button>
        </div>
      </div>
      {strategyOpen && (
        <StrategyPanel
          prompt={strategyPrompt}
          setPrompt={setStrategyPrompt}
          strategy={strategy}
          loading={strategyLoading}
          onClose={() => setStrategyOpen(false)}
          onSubmit={runStrategy}
        />
      )}
    </motion.div>
  );
}

function StrategyPanel({
  prompt,
  setPrompt,
  strategy,
  loading,
  onClose,
  onSubmit,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  strategy: AIStrategyResponse | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (prompt?: string) => void;
}) {
  const suggestions = strategy?.suggested_prompts?.length ? strategy.suggested_prompts : [
    'Find young explosive batsmen under INR 100M',
    'Simulate a safe auction strategy',
    'Which players are risky versus safe?',
  ];

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
      <motion.div initial={{ x: 420 }} animate={{ x: 0 }} className="w-full max-w-xl h-full bg-[#020617] border-l border-indigo-500/20 shadow-2xl flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-white">CricValue Strategy AI</h3>
              <p className="text-xs text-slate-500">Auction intelligence, valuation explainability, and scouting copilot</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-slate-900/70 border border-slate-800 p-4">
            <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-2">Suggested prompts</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(item => (
                <button key={item} onClick={() => onSubmit(item)} className="text-xs px-3 py-2 border border-slate-700 text-slate-300 hover:border-indigo-400 hover:text-indigo-200 transition-colors">
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="border border-indigo-500/20 bg-indigo-500/5 p-5 text-indigo-200 flex items-center gap-3">
              <span className="w-2 h-2 bg-indigo-300 rounded-full animate-ping" />
              AI desk is simulating auction outcomes and scanning valuation dislocations...
            </div>
          ) : strategy ? (
            <div className="space-y-5">
              <div className="border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold">AI Readout</p>
                  <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{Math.round(strategy.confidence * 100)}% confidence</Badge>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{strategy.answer}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniTerminal title="Budget Used" value={`₹${strategy.auction_plan.total_spent}M`} />
                <MiniTerminal title="Players Suggested" value={strategy.auction_plan.suggested_team.length} />
                <MiniTerminal title="Safe Assets" value={strategy.safe_players.slice(0, 2).join(', ') || 'N/A'} />
                <MiniTerminal title="Risk Watch" value={strategy.risky_players.slice(0, 2).join(', ') || 'N/A'} />
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">Ask a question to start the AI market desk.</div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800">
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              placeholder="Ask: Who is the best finisher under INR 100M?"
            />
            <Button onClick={() => onSubmit()} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MiniTerminal({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="border border-slate-800 bg-[#0f172a] p-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">{title}</p>
      <p className="text-sm font-bold text-white leading-snug">{value}</p>
    </div>
  );
}
