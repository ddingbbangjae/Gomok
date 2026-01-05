import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import type { Match } from './types'

const SIZE = 15

const HistoryDetail = () => {
  const { matchId } = useParams()
  const [match, setMatch] = useState<Match | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get<Match>(`/api/matches/${matchId}`).then((res) => setMatch(res.data))
  }, [matchId])

  const boardCells = useMemo(() => match?.final_board.split('') ?? [], [match])

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">경기 상세</h1>
        <button className="text-indigo-600" onClick={() => navigate('/history')}>
          목록으로
        </button>
      </div>
      {match && (
        <div className="bg-white rounded shadow p-4 space-y-2">
          <div>
            {match.black_nickname} (B) vs {match.white_nickname} (W)
          </div>
          <div>승자: {match.winner}</div>
          <div>시간: {new Date(match.finished_at).toLocaleString()}</div>
          <div>한줄평: {match.winner_review ?? '-'}</div>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
            {boardCells.map((c, idx) => (
              <div key={idx} className="aspect-square bg-amber-50 flex items-center justify-center">
                {c === 'B' ? '⚫' : c === 'W' ? '⚪' : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryDetail
