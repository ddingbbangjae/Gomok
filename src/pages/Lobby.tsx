import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDoc, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { ensureAnonymousUser, watchAuth } from '../auth';
import { db } from '../firebase';
import { Match, Room } from '../types';
import HistoryList from '../components/HistoryList';
import { emptyBoard } from '../lib/renju';
import { onSnapshot } from 'firebase/firestore';

export default function Lobby() {
  const [userNickname, setUserNickname] = useState<string>('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [matches, setMatches] = useState<(Match & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = watchAuth((u) => {
      if (u?.displayName) setUserNickname(u.displayName);
      if (!u) navigate('/', { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('finishedAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const items: (Match & { id: string })[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Match) }));
      setMatches(items);
    });
    return () => unsub();
  }, []);

  const handleCreate = async () => {
    if (!auth.currentUser) return navigate('/');
    setLoading(true);
    const nickname = auth.currentUser.displayName ?? 'Player';
    const room: Room = {
      createdAt: serverTimestamp(),
      status: 'waiting',
      players: {
        B: { uid: auth.currentUser.uid, nickname },
        W: null,
      },
      turn: 'B',
      board: emptyBoard(),
      lastMove: null,
      winner: null,
      finishedAt: null,
      moveCount: 0,
      moves: [],
      rule: 'renju',
      matchId: null,
    };
    const docRef = await addDoc(collection(db, 'rooms'), room);
    navigate(`/room/${docRef.id}`);
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;
    const roomRef = doc(db, 'rooms', roomIdInput.trim());
    const snapshot = await getDoc(roomRef);
    if (!snapshot.exists()) {
      alert('Room not found');
      return;
    }
    navigate(`/room/${roomIdInput.trim()}`);
  };

  const handleNicknameSave = async () => {
    if (userNickname.trim()) await ensureAnonymousUser(userNickname);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Lobby</div>
          <div className="text-slate-600 text-sm">Logged in as {userNickname || 'anonymous'}</div>
        </div>
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1"
            value={userNickname}
            onChange={(e) => setUserNickname(e.target.value)}
            placeholder="Nickname"
          />
          <button className="px-3 py-1 bg-slate-700 text-white rounded" onClick={handleNicknameSave}>
            Save
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3 bg-white p-4 rounded-lg shadow">
          <div className="font-semibold">Create room</div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create as Black'}
          </button>
        </div>
        <div className="space-y-3 bg-white p-4 rounded-lg shadow">
          <div className="font-semibold">Join room</div>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              className="border rounded px-3 py-2 flex-1"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="Enter room id"
              required
            />
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">
              Join
            </button>
          </form>
        </div>
      </div>

      <HistoryList matches={matches} title="Recent matches" />
    </div>
  );
}
