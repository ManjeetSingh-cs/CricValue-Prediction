import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, GitCompare, Landmark, Menu, X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Search Player', path: '/search', icon: Search },
  { name: 'Compare Players', path: '/compare', icon: GitCompare },
  { name: 'Auction Simulator', path: '/auction', icon: Landmark },
  { name: 'Register Player', path: '/register', icon: UserPlus },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#1e293b] bg-[#0f172a] p-6 gap-8 overflow-y-auto h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Landmark className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            CricValue <span className="text-indigo-400">AI</span>
          </h1>
        </div>

        <nav className="flex flex-col gap-1 flex-grow">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                location.pathname === item.path 
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              )}
            >
              <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300 transition-colors")} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Market Sentiment</p>
            <p className="text-sm font-medium text-slate-200 mb-2">Bullish +4.2%</p>
            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-indigo-500"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-[#1e293b] bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Landmark className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            CricValue <span className="text-indigo-400">AI</span>
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-400">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[65px] z-40 bg-background/95 backdrop-blur-lg md:hidden p-6"
          >
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl transition-colors",
                    location.pathname === item.path ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-lg font-semibold">{item.name}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
