import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import type { RoomState } from './types'

const SIZE = 15

const Room = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<RoomState | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chats, setChats] = useState<{ nickname: string; text: string; at: string }[]>([])
  const nickname = localStorage.getItem('nickname') || ''
  const userId = localStorage.getItem('user_id') || ''
  const [review, setReview] = useState('')

  useEffect(() => {
    const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/rooms/${roomId}?user_id=${userId}&nickname=${encodeURIComponent(nickname)}`)
    socket.onmessage = (ev) => {
      const data = JSON.parse(ev.data)
      if (data.type === 'state') {
        setState({
          room: data.room,
          board: data.board,
          turn: data.turn,
          players: data.players,
          status: data.status,
          lastMove: data.lastMove,
          moves: data.moves,
        })
      } else if (data.type === 'chat') {
        setChats((prev) => [...prev, { nickname: data.nickname, text: data.text, at: data.at }])
      } else if (data.type === 'finished') {
        alert(`게임 종료: ${data.winner}`)
      } else if (data.type === 'error') {
        alert(data.message)
      }
    }
    socket.onclose = () => navigate('/lobby')
    setWs(socket)
    return () => socket.close()
  }, [roomId])

  const board = useMemo(() => state?.board.split('') ?? Array(SIZE * SIZE).fill('.'), [state])

  const doMove = (idx: number) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'move', idx }))
  }

  const sendChat = () => {
    if (chatInput.trim() && ws) {
      ws.send(JSON.stringify({ type: 'chat', text: chatInput }))
      setChatInput('')
    }
  }

  const submitReview = async () => {
    if (!state?.room || !state?.lastMove) return
    const matchId = (state as any).matchId
    if (!matchId) return
    await axios.post(`/api/matches/${matchId}/review`, { user_id: userId, text: review })
    alert('등록 완료')
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between mb-4">
        <button onClick={() => navigate('/lobby')} className="text-indigo-600">
          ← 로비로
        </button>
        <div className="text-right text-sm text-gray-500">Room: {roomId}</div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="grid grid-cols-15 gap-0.5 bg-yellow-200 p-2 rounded shadow" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
            {board.map((cell, idx) => (
              <button
                key={idx}
                className="aspect-square bg-amber-50 hover:bg-amber-100 text-xl font-bold"
                onClick={() => doMove(idx)}
              >
                {cell === 'B' ? '⚫' : cell === 'W' ? '⚪' : ''}
              </button>
            ))}
          </div>
          <div className="mt-2 text-sm">현재 턴: {state?.turn ?? '-'}</div>
        </div>
        <div className="bg-white rounded shadow p-3 flex flex-col">
          <div className="mb-2 font-semibold">채팅</div>
          <div className="flex-1 border rounded p-2 overflow-y-auto h-64">
            {chats.map((c, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold">{c.nickname}</span>: {c.text}
              </div>
            ))}
          </div>
          <div className="flex mt-2 space-x-2">
            <input className="border rounded px-2 py-1 flex-1" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
            <button className="bg-indigo-600 text-white px-3 rounded" onClick={sendChat}>
              전송
            </button>
          </div>
          {state?.status === 'finished' && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">승자 한줄평</h4>
              <textarea className="border rounded w-full p-2" maxLength={60} value={review} onChange={(e) => setReview(e.target.value)} />
              <button className="bg-emerald-600 text-white px-3 py-1 rounded mt-2" onClick={submitReview}>
                등록
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Room
