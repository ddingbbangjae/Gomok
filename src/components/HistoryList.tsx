import { Link } from 'react-router-dom';
import { Match } from '../types';

interface Props {
  matches: (Match & { id: string })[];
  title?: string;
}

export default function HistoryList({ matches, title }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="font-semibold mb-2">{title ?? 'Recent matches'}</div>
      <div className="space-y-2 text-sm">
        {matches.map((m) => (
          <Link
            to={`/history/${m.id}`}
            key={m.id}
            className="block border rounded p-2 hover:bg-slate-50"
          >
            <div className="flex justify-between">
              <span>{m.players.B.nickname} (B) vs {m.players.W.nickname} (W)</span>
              <span className="font-semibold">{m.winner === 'draw' ? 'Draw' : `${m.winner} wins`}</span>
            </div>
          </Link>
        ))}
        {matches.length === 0 && <div className="text-slate-500">No records yet.</div>}
      </div>
    </div>
  );
}
