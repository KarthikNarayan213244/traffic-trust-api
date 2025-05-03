
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Vehicles from './pages/Vehicles';
import TrustLedger from './pages/TrustLedger';
import Rsus from './pages/Rsus';
import Anomalies from './pages/Anomalies';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/trust-ledger" element={<TrustLedger />} />
        <Route path="/rsus" element={<Rsus />} />
        <Route path="/anomalies" element={<Anomalies />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
