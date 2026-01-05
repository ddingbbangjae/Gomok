import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { Match } from '../types';
import Board from '../components/Board';

export default function MatchDetail() {
  const { matchId } = useParams();
  const [match, setMatch] = useState<(Match & { id: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!matchId) return;
      const ref = doc(db, 'matches', matchId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setError('Match not found');
        return;
      }
      setMatch({ id: snap.id, ...(snap.data() as Match) });
    };
    load();
  }, [matchId]);

  if (error) return <div className="p-4">{error}</div>;
  if (!match) return <div className="p-4">Loading match...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Match detail</h1>
          <div className="text-slate-600 text-sm">Room: {match.roomId}</div>
        </div>
        <button className="text-blue-600 underline" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-2">
        <div className="flex justify-between">
          <div>
            <div>Black: {match.players.B.nickname}</div>
            <div>White: {match.players.W.nickname}</div>
          </div>
          <div className="font-semibold">Winner: {match.winner === 'draw' ? 'Draw' : match.winner}</div>
        </div>
        <div className="text-sm text-slate-600">Moves: {match.moves.length}</div>
        {match.winnerReview && <div className="text-sm">Winner review: {match.winnerReview}</div>}
      </div>

      <Board board={match.finalBoard} lastMove={match.moves[match.moves.length - 1]} />
    </div>
  );
}
