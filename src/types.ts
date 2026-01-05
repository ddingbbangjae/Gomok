export type Stone = 'B' | 'W' | '.';
export type PlayerColor = 'B' | 'W';
export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface PlayerInfo {
  uid: string;
  nickname: string;
}

export interface Room {
  createdAt?: unknown;
  status: RoomStatus;
  players: {
    B: PlayerInfo | null;
    W: PlayerInfo | null;
  };
  turn: PlayerColor;
  board: string;
  lastMove: { idx: number; by: PlayerColor; at?: unknown } | null;
  winner: PlayerColor | 'draw' | null;
  finishedAt?: unknown;
  moveCount: number;
  moves: number[];
  rule: 'renju';
  matchId?: string | null;
}

export interface Match {
  roomId: string;
  players: { B: PlayerInfo; W: PlayerInfo };
  winner: PlayerColor | 'draw';
  finishedAt: unknown;
  moves: number[];
  finalBoard: string;
  winnerReview: string | null;
  createdAt?: unknown;
  rule: 'renju';
}
