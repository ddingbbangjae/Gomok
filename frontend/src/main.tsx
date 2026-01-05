import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './pages/App'
import Lobby from './pages/Lobby'
import Room from './pages/Room'
import HistoryList from './pages/HistoryList'
import HistoryDetail from './pages/HistoryDetail'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/history" element={<HistoryList />} />
        <Route path="/history/:matchId" element={<HistoryDetail />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
