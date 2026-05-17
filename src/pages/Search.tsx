import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search as SearchIcon, MapPin, TrendingUp, Plus, BrainCircuit, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { usePlayers } from '@/hooks/usePlayers';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { playerService } from '@/services/api';
import { PlayerAnalysis, PlayerTrend } from '@/types';

export default function PlayerSearch() {
  const { players, loading, error } = usePlayers();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [analysisPlayer, setAnalysisPlayer] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PlayerAnalysis | null>(null);
  const [trend, setTrend] = useState<PlayerTrend | null>(null);

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || player.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const loadAnalysis = async (playerName: string) => {
    setAnalysisPlayer(playerName);
    setAnalysisLoading(playerName);
    setAnalysisError(null);
    try {
      const [analysisResponse, trendResponse] = await Promise.all([
        playerService.getPlayerAnalysis(playerName),
        playerService.getPlayerTrend(playerName),
      ]);
      setAnalysis(analysisResponse);
      setTrend(trendResponse);
    } catch (err) {
      setAnalysis(null);
      setTrend(null);
      setAnalysisError('Unable to load player analysis. Please check the backend connection.');
    } finally {
      setAnalysisLoading(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight text-white">Player Intelligence</h2>
          <p className="text-slate-500 max-w-xl">Detailed performance metrics and predictive valuations for global cricket assets.</p>
        </div>
        <Button 
          onClick={() => navigate('/register')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Local Player
        </Button>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <div className="relative flex-1 group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <Input 
              placeholder="Search by name, team, or nationality..." 
              className="pl-12 h-14 bg-[#0f172a] border-slate-800 rounded-2xl focus-visible:ring-indigo-500/50 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs defaultValue="All" className="w-full md:w-auto" onValueChange={setRoleFilter}>
            <TabsList className="h-14 bg-[#0f172a] border border-slate-800 rounded-2xl p-1 shrink-0">
              {['All', 'Batsman', 'Bowler', 'All-rounder'].map((role) => (
                <TabsTrigger 
                  key={role} 
                  value={role} 
                  className="rounded-xl px-6 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-medium"
                >
                  {role}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {error ? (
            <div className="col-span-full rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          ) : loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="glass-card animate-pulse border-slate-800 h-[300px]">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800" />
                    <div className="space-y-2">
                       <div className="w-20 h-4 bg-slate-800 rounded" />
                       <div className="w-12 h-4 bg-slate-800 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="bg-[#0f172a] border-slate-800 group-hover:border-indigo-500/50 transition-all duration-300 pointer-events-auto h-full flex flex-col overflow-hidden shadow-xl shadow-black/20">
                  <CardContent className="p-0 flex-1 flex flex-col">
                    {/* Header Image/Background */}
                    <div className="h-24 bg-gradient-to-br from-indigo-900 to-[#020617] relative overflow-hidden">
                       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#6366f1_0%,_transparent_70%)]" />
                       <div className="absolute -bottom-6 left-6 w-20 h-20 rounded-2xl bg-[#0f172a] border-4 border-[#020617] flex items-center justify-center text-3xl font-bold text-indigo-400 shadow-xl">
                          {player.name.charAt(0)}
                       </div>
                       <div className="absolute top-4 right-6 text-right">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Predicted Index</p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                             <TrendingUp className="w-4 h-4 text-emerald-400" />
                             <span className="text-xl font-bold text-white tracking-tight">₹{player.predictedValue}M</span>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 pt-10 flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors text-white">{player.name}</h3>
                          <Badge variant="outline" className="text-[9px] h-4 border-slate-700 uppercase tracking-tighter text-slate-400">{player.role}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                           <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {player.nationality}
                           </div>
                           <span>•</span>
                           <span>{player.team}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                           <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Batting Avg</p>
                           <p className="text-lg font-bold font-mono tracking-tighter text-white">{player.stats.batting.average}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                           <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Strike Rate</p>
                           <p className="text-lg font-bold font-mono tracking-tighter text-white">{player.stats.batting.strikeRate}</p>
                        </div>
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Recent Form</span>
                          <div className="flex gap-1">
                            {player.recentForm.map((v, i) => (
                              <div key={i} className={cn(
                                "w-2 h-2 rounded-full",
                                v > 40 ? "bg-emerald-500" : v > 20 ? "bg-amber-500/50" : "bg-rose-500/30"
                              )} />
                            ))}
                          </div>
                        </div>
                        <Button
                          onClick={() => loadAnalysis(player.name)}
                          disabled={analysisLoading === player.name}
                          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-bold h-11"
                        >
                          {analysisLoading === player.name ? "Analyzing..." : "Deep Performance Analysis"}
                        </Button>
                        {analysisPlayer === player.name && (
                          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-4">
                            {analysisError ? (
                              <p className="text-xs text-rose-300">{analysisError}</p>
                            ) : analysis ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <BrainCircuit className="w-4 h-4 text-indigo-300" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">AI Analysis</span>
                                  </div>
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] uppercase border-slate-700",
                                    analysis.risk_level === 'low' ? "text-emerald-300" : analysis.risk_level === 'medium' ? "text-amber-300" : "text-rose-300"
                                  )}>
                                    {analysis.risk_level} risk
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="text-slate-500 font-bold uppercase mb-1">Score</p>
                                    <p className="text-white text-lg font-bold">{analysis.performance_score}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 font-bold uppercase mb-1">Trend</p>
                                    <p className="text-white text-lg font-bold capitalize">{analysis.recent_trend}</p>
                                  </div>
                                </div>
                                {trend && (
                                  <div className="h-28">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={trend.last_5_matches}>
                                        <XAxis dataKey="date" hide />
                                        <Tooltip contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 8 }} />
                                        <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={false} />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Strengths</p>
                                  <div className="flex flex-wrap gap-1">
                                    {analysis.strengths.map(item => <Badge key={item} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{item}</Badge>)}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Weaknesses</p>
                                  <div className="flex flex-wrap gap-1">
                                    {analysis.weaknesses.map(item => <Badge key={item} className="bg-rose-500/10 text-rose-300 border border-rose-500/20">{item}</Badge>)}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-slate-400">Loading analysis...</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-xl font-medium text-muted-foreground">No players found matching your criteria</p>
              <Button variant="link" onClick={() => { setSearchTerm(''); setRoleFilter('All'); }}>Clear all filters</Button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
