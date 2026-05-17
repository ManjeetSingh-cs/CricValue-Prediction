import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PlayerSearch from './pages/Search';
import PlayerComparison from './pages/Compare';
import AuctionSimulator from './pages/Auction';
import RegisterPlayer from './pages/RegisterPlayer';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<PlayerSearch />} />
            <Route path="/compare" element={<PlayerComparison />} />
            <Route path="/auction" element={<AuctionSimulator />} />
            <Route path="/register" element={<RegisterPlayer />} />
          </Routes>
        </Layout>
      </Router>
    </TooltipProvider>
  );
}

