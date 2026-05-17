import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GitCompare, Plus, X, IndianRupee, Zap, Target, Shield, Cpu } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { usePlayers } from '@/hooks/usePlayers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Player } from '@/types';

export default function PlayerComparison() {
  const { players, loading } = usePlayers();
  const [selectedPlayer1Id, setSelectedPlayer1Id] = useState<string | null>(null);
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState<string | null>(null);

  const p1 = players.find(p => p.id === selectedPlayer1Id);
  const p2 = players.find(p => p.id === selectedPlayer2Id);

  const getRadarData = (player1?: Player, player2?: Player) => {
    const stats = [
      { subject: 'Batting Avg', fullMark: 100 },
      { subject: 'Strike Rate', fullMark: 200 },
      { subject: 'Consistency', fullMark: 100 },
      { subject: 'Bowling Eco', fullMark: 15 },
      { subject: 'Pressure', fullMark: 100 },
    ];

    return stats.map(s => ({
      subject: s.subject,
      A: player1 ? (s.subject === 'Strike Rate' ? player1.stats.batting.strikeRate : 
                   s.subject === 'Batting Avg' ? player1.stats.batting.average * 2 : 
                   s.subject === 'Bowling Eco' ? (15 - player1.stats.bowling.economy) * 6 :
                   75) : 0,
      B: player2 ? (s.subject === 'Strike Rate' ? player2.stats.batting.strikeRate : 
                   s.subject === 'Batting Avg' ? player2.stats.batting.average * 2 : 
                   s.subject === 'Bowling Eco' ? (15 - player2.stats.bowling.economy) * 6 :
                   80) : 0,
      fullMark: s.fullMark
    }));
  };

  const radarData = getRadarData(p1, p2);

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-4xl font-bold tracking-tight mb-2">Alpha Comparison</h2>
        <p className="text-muted-foreground">Direct side-by-side asset comparison with quantitative performance mapping.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Selection Slots */}
        <CompareSlot 
           player={p1} 
           players={players} 
           onSelect={setSelectedPlayer1Id} 
           onClear={() => setSelectedPlayer1Id(null)}
           slotNumber={1}
        />
        
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full border border-slate-700 bg-slate-900 items-center justify-center text-indigo-400 font-bold shadow-2xl">
           VS
        </div>

        <CompareSlot 
           player={p2} 
           players={players} 
           onSelect={setSelectedPlayer2Id} 
           onClear={() => setSelectedPlayer2Id(null)}
           slotNumber={2}
        />
      </div>

      {p1 && p2 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Radar Chart */}
          <Card className="bg-[#0f172a] border-slate-800 h-[500px] shadow-xl shadow-black/20">
             <CardHeader>
                <CardTitle className="text-white">Skill Matrix Comparison</CardTitle>
                <CardDescription className="text-slate-500">Multi-dimensional performance overview</CardDescription>
             </CardHeader>
             <CardContent className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                      <Radar name={p1.name} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                      <Radar name={p2.name} dataKey="B" stroke="#ffffff" fill="#ffffff" fillOpacity={0.1} />
                      <Legend />
                   </RadarChart>
                </ResponsiveContainer>
             </CardContent>
          </Card>

          {/* Value Comparison */}
          <Card className="bg-[#0f172a] border-slate-800 h-[500px] flex flex-col shadow-xl shadow-black/20">
             <CardHeader>
                <CardTitle className="text-white">Financial Analysis</CardTitle>
                <CardDescription className="text-slate-500">Predicted market value comparison</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 flex flex-col justify-center gap-10 p-8">
                <div className="space-y-8">
                   <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-[120px]">
                         <p className="text-xs text-slate-500 font-medium truncate">{p1.name}</p>
                         <h4 className="text-2xl font-bold tracking-tighter text-indigo-400">₹{p1.predictedValue}M</h4>
                      </div>
                      <div className="flex-grow h-2 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${(p1.predictedValue / 200) * 100}%` }} />
                      </div>
                   </div>
                   <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-[120px]">
                         <p className="text-xs text-slate-500 font-medium truncate">{p2.name}</p>
                         <h4 className="text-2xl font-bold tracking-tighter text-white">₹{p2.predictedValue}M</h4>
                      </div>
                      <div className="flex-grow h-2 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-slate-600" style={{ width: `${(p2.predictedValue / 200) * 100}%` }} />
                      </div>
                   </div>
                </div>

                <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                   <div className="flex items-center gap-3 mb-3">
                      <Cpu className="w-5 h-5 text-indigo-400" />
                      <span className="font-bold text-[10px] uppercase tracking-widest text-indigo-300">AI Verdict</span>
                   </div>
                   <p className="text-sm leading-relaxed text-slate-400">
                      {p1.predictedValue > p2.predictedValue 
                        ? `${p1.name} holds a ${Math.round(((p1.predictedValue/p2.predictedValue)-1)*100)}% valuation premium over ${p2.name} due to superior metrics.` 
                        : `${p2.name} is currently the more valuable asset, primarily driven by high market demand.`}
                   </p>
                </div>
             </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function CompareSlot({ player, players, onSelect, onClear, slotNumber }: { player?: Player, players: Player[], onSelect: (id: string) => void, onClear: () => void, slotNumber: number }) {
  return (
    <Card className={cn(
      "bg-[#0f172a] border transition-all duration-300 min-h-[300px] flex flex-col justify-center items-center text-center p-8 rounded-2xl shadow-xl shadow-black/20",
      player ? "border-indigo-500/20" : "border-dashed border-slate-800 hover:border-indigo-500/30"
    )}>
      {player ? (
        <div className="w-full relative">
           <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -top-4 -right-4 rounded-full bg-slate-900 hover:bg-rose-500/20 hover:text-rose-500 transition-colors border border-slate-800 text-slate-500"
            onClick={onClear}
           >
             <X className="w-4 h-4" />
           </Button>
           <div className="space-y-6">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl font-bold text-indigo-400 shadow-2xl">
                 {player.name.charAt(0)}
              </div>
              <div>
                 <h3 className="text-2xl font-bold mb-1 text-white">{player.name}</h3>
                 <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="border-slate-800 uppercase tracking-tighter text-[10px] text-slate-500">{player.role}</Badge>
                    <span className="text-sm text-slate-400">{player.team}</span>
                 </div>
              </div>
              <div className="flex justify-center gap-4 py-4">
                 <StatMini label="AVG" value={player.stats.batting.average} />
                 <StatMini label="SR" value={player.stats.batting.strikeRate} />
                 <StatMini label="VAL" value={`₹${player.predictedValue}M`} />
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-4 w-full px-6">
           <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-dashed border-slate-800 flex items-center justify-center text-slate-600 group">
              <Plus className="w-8 h-8 group-hover:text-indigo-400 transition-colors" />
           </div>
           <p className="text-lg font-medium text-slate-500 tracking-tight">Select Player {slotNumber}</p>
           <div className="w-full max-w-xs mx-auto">
            <Select onValueChange={onSelect}>
                <SelectTrigger className="w-full bg-slate-900 border-slate-800 h-12 rounded-xl text-white">
                  <SelectValue placeholder="Choose a player..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  {players.map(p => (
                    <SelectItem key={p.id} value={p.id} className="hover:bg-slate-800">{p.name} ({p.team})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>
        </div>
      )}
    </Card>
  );
}

function StatMini({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="text-center px-4 py-2 border-r last:border-r-0 border-slate-800">
       <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">{label}</p>
       <p className="text-sm font-bold tracking-tight text-white">{value}</p>
    </div>
  );
}
