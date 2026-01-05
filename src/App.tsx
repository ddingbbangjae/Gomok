import { Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import History from './pages/History';
import MatchDetail from './pages/MatchDetail';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:matchId" element={<MatchDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
