import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, ArrowLeft, IndianRupee, Trophy, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playerService } from '@/services/api';

export default function RegisterPlayer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    team: 'Local',
    role: 'Batsman',
    nationality: 'Indian',
    currentValue: 10,
    predictedValue: 15,
    matches: 5,
    stats: {
      batting: { average: 30, strikeRate: 120, totalRuns: 500 },
      bowling: { economy: 8.5, wickets: 20, average: 25 }
    },
    recentForm: [40, 50, 10, 80, 20]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const response = await playerService.createPlayer(formData);
      if (response.success) {
        setNotice({ type: 'success', message: `${response.player.name} saved with AI value ₹${response.player.predictedValue}M.` });
        window.setTimeout(() => navigate('/search'), 700);
      } else {
        setNotice({ type: 'error', message: 'Player could not be saved. Please retry.' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Failed to save player. Check that the FastAPI backend and MongoDB are running.' });
    } finally {
      setLoading(false);
    }
  };

  const updateRecentForm = (index: number, value: number) => {
    const recentForm = [...formData.recentForm];
    recentForm[index] = value;
    setFormData({ ...formData, recentForm });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8 pb-32"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-400">
           <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
           <h2 className="text-3xl font-bold text-white">Register Regional Asset</h2>
           <p className="text-slate-500 text-sm">Add local scouting data into the AI intelligence engine.</p>
        </div>
      </div>

      {notice && (
        <div className={cn(
          "rounded-xl border px-4 py-3 text-sm font-medium",
          notice.type === 'success'
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-rose-500/30 bg-rose-500/10 text-rose-300"
        )}>
          {notice.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-[#0f172a] border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
          <CardHeader className="bg-slate-900/30 border-b border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Primary Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Player Full Name</label>
                   <Input 
                      required
                      className="bg-slate-900 border-slate-800 h-12 text-white focus-visible:ring-indigo-500/50" 
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Regional Team / Academy</label>
                   <Input 
                      required
                      className="bg-slate-900 border-slate-800 h-12 text-white focus-visible:ring-indigo-500/50" 
                      placeholder="e.g. Mumbai local"
                      value={formData.team}
                      onChange={e => setFormData({...formData, team: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Primary Role</label>
                   <Select onValueChange={v => setFormData({...formData, role: v})} defaultValue={formData.role}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 h-12 text-white">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                         <SelectItem value="Batsman">Batsman</SelectItem>
                         <SelectItem value="Bowler">Bowler</SelectItem>
                         <SelectItem value="All-rounder">All-rounder</SelectItem>
                         <SelectItem value="Wicketkeeper">Wicketkeeper</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Nationality</label>
                   <Input 
                      className="bg-slate-900 border-slate-800 h-12 text-white focus-visible:ring-indigo-500/50" 
                      value={formData.nationality}
                      onChange={e => setFormData({...formData, nationality: e.target.value})}
                   />
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
          <CardHeader className="bg-slate-900/30 border-b border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Performance Metrics
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">The backend predicts AI target value automatically after save.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricInput label="Initial Market Index (₹M)" value={formData.currentValue} onChange={value => setFormData({...formData, currentValue: value})} />
                <MetricInput label="Matches Played" value={formData.matches} onChange={value => setFormData({...formData, matches: value})} />
                <MetricInput label="Batting Average" step="0.1" value={formData.stats.batting.average} onChange={value => setFormData({
                  ...formData, 
                  stats: { ...formData.stats, batting: { ...formData.stats.batting, average: value } }
                })} />
                <MetricInput label="Total Runs" value={formData.stats.batting.totalRuns} onChange={value => setFormData({
                  ...formData,
                  stats: { ...formData.stats, batting: { ...formData.stats.batting, totalRuns: value } }
                })} />
                <MetricInput label="Strike Rate" step="0.1" value={formData.stats.batting.strikeRate} onChange={value => setFormData({
                  ...formData,
                  stats: { ...formData.stats, batting: { ...formData.stats.batting, strikeRate: value } }
                })} />
                <MetricInput label="Wickets" value={formData.stats.bowling.wickets} onChange={value => setFormData({
                  ...formData,
                  stats: { ...formData.stats, bowling: { ...formData.stats.bowling, wickets: value } }
                })} />
                <MetricInput label="Economy" step="0.1" value={formData.stats.bowling.economy} onChange={value => setFormData({
                  ...formData,
                  stats: { ...formData.stats, bowling: { ...formData.stats.bowling, economy: value } }
                })} />
             </div>

             <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Last 5 Match Scores</label>
                <div className="grid grid-cols-5 gap-3">
                  {formData.recentForm.map((score, index) => (
                    <Input
                      key={index}
                      type="number"
                      className="bg-slate-900 border-slate-800 h-12 text-white"
                      value={score}
                      onChange={e => updateRecentForm(index, Number(e.target.value))}
                    />
                  ))}
                </div>
             </div>

             <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300 leading-relaxed">
                The ML service calculates predicted value on save, stores the player in MongoDB, and returns the live record for search and auction features.
             </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
           <Button variant="ghost" type="button" onClick={() => navigate(-1)} className="h-14 px-8 text-slate-400 font-bold">Cancel</Button>
           <Button 
              type="submit" 
              disabled={loading}
              className="h-14 px-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
           >
              {loading ? "Processing Intelligence..." : "Integrate Player Data"}
           </Button>
        </div>
      </form>
    </motion.div>
  );
}

function MetricInput({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (value: number) => void; step?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
      <Input 
        type="number"
        step={step}
        className="bg-slate-900 border-slate-800 h-12 text-white focus-visible:ring-indigo-500/50" 
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}
