import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ensureAnonymousUser } from '../auth';

export default function Landing() {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await ensureAnonymousUser(nickname);
      navigate('/lobby');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6">Renju Gomoku</h1>
      <p className="mb-4 text-slate-700">Enter a nickname to start playing. Anonymous authentication is used.</p>
      <form onSubmit={handleStart} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nickname</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Your nickname"
            required
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Starting...' : 'Start'}
        </button>
      </form>
    </div>
  );
}
