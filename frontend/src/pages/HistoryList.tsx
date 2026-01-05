import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { Match } from './types'

const HistoryList = () => {
  const [matches, setMatches] = useState<Match[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    axios
      .get<Match[]>('/api/matches?limit=20')
      .then((res) => setMatches(res.data))
      .catch(() => setMatches([]))
  }, [])

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">경기 기록</h1>
        <button className="text-indigo-600" onClick={() => navigate('/lobby')}>
          로비로
        </button>
      </div>
      <div className="bg-white rounded shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-2">시간</th>
              <th className="p-2">플레이어</th>
              <th className="p-2">승자</th>
              <th className="p-2">한줄평</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-2">{new Date(m.finished_at).toLocaleString()}</td>
                <td className="p-2">{m.black_nickname} (B) vs {m.white_nickname} (W)</td>
                <td className="p-2">{m.winner}</td>
                <td className="p-2">{m.winner_review ?? '-'}</td>
                <td className="p-2">
                  <button className="text-indigo-600" onClick={() => navigate(`/history/${m.id}`)}>
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default HistoryList
