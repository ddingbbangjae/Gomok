export type Match = {
  id: string
  room_id: string
  black_nickname: string
  white_nickname: string
  winner: 'B' | 'W' | 'draw'
  started_at: string
  finished_at: string
  moves: number[]
  final_board: string
  winner_review?: string | null
}

export type RoomState = {
  room: string
  board: string
  turn: 'B' | 'W' | null
  players: Record<string, { nickname: string }>
  status: 'waiting' | 'playing' | 'finished'
  lastMove?: { idx: number; color: string }
  moves: number[]
}
