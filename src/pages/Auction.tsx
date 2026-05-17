import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, Shield, IndianRupee, Trash2, Plus, Sparkles, AlertCircle, Info, BrainCircuit } from 'lucide-react';
import { usePlayers } from '@/hooks/usePlayers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Player } from '@/types';

import { Skeleton } from '@/components/ui/skeleton';

const INITIAL_BUDGET = 1000; // ₹1000M

export default function AuctionSimulator() {
  const { players, loading } = usePlayers();
  const [squad, setSquad] = useState<Player[]>([]);
  const [suggestions, setSuggestions] = useState<Player[]>([]);

  const totalSpent = useMemo(() => squad.reduce((sum, p) => sum + p.predictedValue, 0), [squad]);
  const remainingBudget = INITIAL_BUDGET - totalSpent;

  const addToSquad = (player: Player) => {
    if (squad.some(p => p.id === player.id)) return;
    if (remainingBudget < player.predictedValue) return;
    setSquad([...squad, player]);
  };

  const removeFromSquad = (id: string) => {
    setSquad(squad.filter(p => p.id !== id));
  };

  const generateSuggestions = () => {
    // Dummy AI Suggestion: Logic for best players fitting remaining budget
    const affordable = players.filter(p => p.predictedValue <= (remainingBudget / 2) && !squad.some(s => s.id === p.id));
    const sorted = affordable.sort((a, b) => b.stats.batting.average - a.stats.batting.average);
    setSuggestions(sorted.slice(0, 3));
  };

  return (
    <div className="space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
           <h2 className="text-2xl font-bold text-white">Auction Command Center</h2>
           <p className="text-slate-500 text-sm">Strategic capital allocation and squad building simulator.</p>
        </div>
        <div className="bg-[#0f172a] px-8 py-5 rounded-2xl border border-slate-800 flex items-center gap-8 shadow-xl shadow-black/40">
           <div className="text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Squad Strength</p>
              <p className="text-2xl font-bold text-white">{squad.length}/15</p>
           </div>
           <div className="h-10 w-[1px] bg-slate-800" />
           <div className="text-left">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Available Capital</p>
              <div className="flex items-center gap-2">
                 <h4 className={cn(
                    "text-3xl font-bold tracking-tighter",
                    remainingBudget < 200 ? "text-amber-500" : "text-indigo-400"
                 )}>
                    ₹{remainingBudget}M
                 </h4>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Player Market */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="bg-[#0f172a] border-slate-800 flex flex-col h-[700px] shadow-xl shadow-black/20 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 bg-slate-900/30">
                 <div>
                    <CardTitle className="text-white">Asset Marketplace</CardTitle>
                    <CardDescription className="text-slate-500 text-xs">Verified players for acquisition</CardDescription>
                 </div>
                 <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-[10px]">LIVE FEED</Badge>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                 <ScrollArea className="h-full p-6">
                    <div className="space-y-3">
                       {loading ? (
                         Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl bg-slate-800/50" />)
                       ) : (
                         players.filter(p => !squad.some(s => s.id === p.id)).map(player => (
                           <motion.div
                             key={player.id}
                             whileHover={{ x: 5 }}
                             className="p-4 rounded-xl bg-[#020617]/40 border border-slate-800 hover:border-indigo-500/30 transition-all flex items-center justify-between group"
                           >
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-lg border border-slate-800 text-indigo-400">
                                    {player.name.charAt(0)}
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors">{player.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                       <span className="text-[10px] text-slate-500 uppercase font-medium">{player.team}</span>
                                       <span className="text-[10px] text-slate-700">•</span>
                                       <Badge variant="outline" className="text-[9px] h-4 border-slate-800 text-slate-400">{player.role}</Badge>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-6">
                                 <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Valuation</p>
                                    <p className="font-bold tracking-tight text-white">₹{player.predictedValue}M</p>
                                 </div>
                                 <Button 
                                    size="sm" 
                                    disabled={remainingBudget < player.predictedValue}
                                    onClick={() => addToSquad(player)}
                                    className="rounded-lg px-6 bg-indigo-600 hover:bg-indigo-500 transition-all text-white font-bold h-9 border-none shadow-lg shadow-indigo-600/20"
                                 >
                                    Bid
                                 </Button>
                              </div>
                           </motion.div>
                         ))
                       )}
                    </div>
                 </ScrollArea>
              </CardContent>
           </Card>

           {/* Mobile suggestion placeholder */}
           <div className="lg:hidden">
              <Button onClick={generateSuggestions} className="w-full h-14 rounded-2xl gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                 <Sparkles className="w-5 h-5" />
                 Generate AI Squad Picks
              </Button>
           </div>
        </div>

        {/* Right Column: Squad & Suggestions */}
        <div className="space-y-6">
           {/* Current Squad */}
           <Card className="bg-[#0f172a] border-slate-800 flex flex-col h-[400px] shadow-xl shadow-black/20 overflow-hidden">
              <CardHeader className="bg-slate-900/30 border-b border-slate-800">
                 <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    Proprietary Squad
                 </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                 <ScrollArea className="h-full p-6">
                    {squad.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6 mt-10">
                         <Landmark className="w-12 h-12 mb-4 text-slate-500" />
                         <p className="text-sm text-slate-500">Your squad is currently empty. Acquire assets from the marketplace.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                         <AnimatePresence>
                           {squad.map(player => (
                              <motion.div
                                key={player.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 group"
                              >
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/20">
                                       {player.name.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-slate-200">{player.name}</p>
                                       <p className="text-[10px] text-slate-500">₹{player.predictedValue}M</p>
                                    </div>
                                 </div>
                                 <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                    onClick={() => removeFromSquad(player.id)}
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </motion.div>
                           ))}
                         </AnimatePresence>
                      </div>
                    )}
                 </ScrollArea>
              </CardContent>
           </Card>

           {/* AI Suggestions */}
           <Card className="bg-[#0f172a] border-slate-800 overflow-hidden shadow-xl shadow-black/20">
              <CardHeader className="bg-indigo-500/5 pb-4 border-b border-indigo-500/10">
                 <CardTitle className="text-sm flex items-center gap-2 text-white font-bold">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    Strategic Picks
                 </CardTitle>
                 <CardDescription className="text-[10px] text-slate-500 uppercase tracking-wider">Optimized for remaining budget</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 {suggestions.length === 0 ? (
                    <Button onClick={generateSuggestions} variant="outline" className="w-full border-slate-800 bg-slate-900/50 gap-2 rounded-xl py-6 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all font-bold">
                       <Sparkles className="w-4 h-4 text-amber-500" />
                       Analyze Market Opportunities
                    </Button>
                 ) : (
                    <div className="space-y-3">
                       {suggestions.map(player => (
                         <div key={player.id} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                            <div>
                               <p className="text-xs font-bold text-slate-200">{player.name}</p>
                               <p className="text-[10px] text-slate-500">Budget Fit: ₹{player.predictedValue}M</p>
                            </div>
                            <Button size="icon" variant="ghost" className="hover:bg-emerald-500/10" onClick={() => { addToSquad(player); setSuggestions(suggestions.filter(s => s.id !== player.id)); }}>
                               <Plus className="w-4 h-4 text-emerald-400" />
                            </Button>
                         </div>
                       ))}
                       <Button variant="link" size="sm" onClick={() => setSuggestions([])} className="text-[10px] text-slate-500 uppercase tracking-widest p-0 h-auto hover:text-indigo-400">Clear Insights</Button>
                    </div>
                 )}
                 
                 <div className="pt-4 mt-2 border-t border-slate-800">
                    <div className="flex gap-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] leading-relaxed text-indigo-300">
                       <Info className="w-4 h-4 shrink-0 text-indigo-400" />
                       Pro Tip: Balancing All-rounders ensures higher flexibility in middle phases of simulation.
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
