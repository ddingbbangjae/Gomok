import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { Match } from '../types';
import HistoryList from '../components/HistoryList';

export default function History() {
  const [matches, setMatches] = useState<(Match & { id: string })[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadMatches = async (append = false) => {
    setLoading(true);
    let q = query(collection(db, 'matches'), orderBy('finishedAt', 'desc'), limit(20));
    if (append && lastDoc) {
      q = query(collection(db, 'matches'), orderBy('finishedAt', 'desc'), startAfter(lastDoc), limit(20));
    }
    const snap = await getDocs(q);
    const items: (Match & { id: string })[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Match) }));
    setLastDoc(snap.docs[snap.docs.length - 1]);
    setMatches((prev) => (append ? [...prev, ...items] : items));
    setLoading(false);
  };

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Match history</h1>
        <a href="/lobby" className="text-blue-600 underline">Lobby</a>
      </div>
      <HistoryList matches={matches} title="All matches" />
      <button
        onClick={() => loadMatches(true)}
        className="px-4 py-2 bg-slate-800 text-white rounded"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Load more'}
      </button>
    </div>
  );
}
