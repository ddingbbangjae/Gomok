import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const App = () => {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('nickname')
    if (stored) setNickname(stored)
  }, [])

  const handleStart = () => {
    if (!nickname.trim()) return
    localStorage.setItem('nickname', nickname.trim())
    if (!localStorage.getItem('user_id')) {
      localStorage.setItem('user_id', crypto.randomUUID())
    }
    navigate('/lobby')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-emerald-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-center">Renju Gomoku</h1>
        <p className="text-gray-600 mb-4 text-center">닉네임을 입력하고 시작하세요.</p>
        <input
          className="w-full border rounded px-3 py-2 mb-4"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nickname"
        />
        <button
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
          onClick={handleStart}
          disabled={!nickname.trim()}
        >
          시작하기
        </button>
      </div>
    </div>
  )
}

export default App
