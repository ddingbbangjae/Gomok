import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { Match } from './types'

const Lobby = () => {
  const nickname = localStorage.getItem('nickname') || ''
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState('')
  const [history, setHistory] = useState<Match[]>([])
  const api = axios.create({ baseURL: '/api' })

  useEffect(() => {
    api.get<Match[]>('/matches?limit=10').then((res) => setHistory(res.data)).catch(() => setHistory([]))
  }, [])

  const createRoom = async () => {
    const res = await api.post('/rooms', { nickname })
    navigate(`/room/${res.data.roomId}`)
  }

  const joinRoom = async () => {
    await api.post(`/rooms/${roomId}/join`, { nickname })
    navigate(`/room/${roomId}`)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">로비</h1>
        <div className="space-x-2">
          <button className="px-4 py-2 bg-slate-200 rounded" onClick={() => navigate('/history')}>
            경기 기록
          </button>
          <button className="px-4 py-2 bg-amber-200 rounded" onClick={() => navigate('/')}>닉네임 변경</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">새 방 만들기</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={createRoom} disabled={!nickname}>
            방 생성 (흑)
          </button>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">방 참가</h2>
          <input
            className="border px-3 py-2 rounded w-full mb-2"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button className="bg-emerald-600 text-white px-4 py-2 rounded w-full" onClick={joinRoom} disabled={!roomId}>
            참가 (백)
          </button>
        </div>
      </div>
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">최근 경기 10개</h3>
        <ul className="space-y-2">
          {history.map((m) => (
            <li key={m.id} className="flex justify-between border-b pb-1">
              <span>
                {m.black_nickname} (B) vs {m.white_nickname} (W)
              </span>
              <button className="text-indigo-600" onClick={() => navigate(`/history/${m.id}`)}>
                보기
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Lobby
