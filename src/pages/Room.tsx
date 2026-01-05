import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import Board from '../components/Board';
import Chat, { ChatMessage } from '../components/Chat';
import { Match, PlayerColor, Room } from '../types';
import { BOARD_SIZE, checkRenjuForbidden, isWin, setStone } from '../lib/renju';
import HistoryList from '../components/HistoryList';
import { watchAuth } from '../auth';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<(Room & { id: string }) | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [matches, setMatches] = useState<(Match & { id: string })[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const myColor: PlayerColor | null = useMemo(() => {
    if (!room || !auth.currentUser) return null;
    if (room.players.B?.uid === auth.currentUser.uid) return 'B';
    if (room.players.W?.uid === auth.currentUser.uid) return 'W';
    return null;
  }, [room]);

  useEffect(() => {
    const unsub = watchAuth((u) => {
      if (!u) navigate('/', { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    const unsubRoom = onSnapshot(roomRef, async (snap) => {
      if (!snap.exists()) {
        setStatusMessage('Room not found.');
        return;
      }
      const data = { id: snap.id, ...(snap.data() as Room) };
      setRoom(data);
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const isPlayer = data.players.B?.uid === uid || data.players.W?.uid === uid;
        if (!isPlayer) {
          if (data.players.W) {
            alert('Room is full.');
            navigate('/lobby', { replace: true });
            return;
          }
          if (!data.players.W) {
            await updateDoc(roomRef, {
              players: { ...data.players, W: { uid, nickname: auth.currentUser.displayName || 'Player' } },
              status: 'playing',
            });
          }
        }
      }
    });

    const chatQuery = query(collection(db, 'rooms', roomId, 'chat'), orderBy('createdAt', 'asc'), limit(50));
    const unsubChat = onSnapshot(chatQuery, (snap) => {
      const items: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, 'id'>),
      }));
      setChatMessages(items);
    });

    const matchesQuery = query(
      collection(db, 'matches'),
      orderBy('finishedAt', 'desc'),
      limit(10),
    );
    const unsubMatches = onSnapshot(matchesQuery, (snap) => {
      const items: (Match & { id: string })[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Match) }));
      setMatches(items);
    });

    return () => {
      unsubRoom();
      unsubChat();
      unsubMatches();
    };
  }, [roomId, navigate]);

  useEffect(() => {
    if (!roomId || !room || room.status !== 'finished' || room.matchId) return;
    const createMatch = async () => {
      const matchRef = doc(db, 'matches', roomId);
      const existing = await getDoc(matchRef);
      if (existing.exists()) return;
      if (!room.players.B || !room.players.W || room.winner === null) return;
      const match: Match = {
        roomId,
        players: { B: room.players.B, W: room.players.W },
        winner: room.winner,
        finishedAt: room.finishedAt ?? serverTimestamp(),
        moves: room.moves,
        finalBoard: room.board,
        winnerReview: null,
        createdAt: serverTimestamp(),
        rule: 'renju',
      };
      await setDoc(matchRef, match);
      await updateDoc(doc(db, 'rooms', roomId), { matchId: matchRef.id });
    };
    createMatch();
  }, [roomId, room]);

  const handlePlay = async (idx: number) => {
    if (!roomId || !auth.currentUser || !room) return;
    const color = myColor;
    if (!color) return alert('You are not a player in this room.');
    const roomRef = doc(db, 'rooms', roomId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) throw new Error('Room missing');
      const data = snap.data() as Room;
      if (data.status !== 'playing') throw new Error('Game is not active');
      const playerColor = data.players.B?.uid === auth.currentUser!.uid ? 'B' : data.players.W?.uid === auth.currentUser!.uid ? 'W' : null;
      if (!playerColor) throw new Error('Not a player');
      if (playerColor !== data.turn) throw new Error('Not your turn');
      if (idx < 0 || idx >= BOARD_SIZE * BOARD_SIZE) throw new Error('Out of range');
      if (data.board[idx] !== '.') throw new Error('Cell occupied');

      const updatedBoard = setStone(data.board, idx, playerColor);
      const forbidden = checkRenjuForbidden(updatedBoard, idx, playerColor);
      if (!forbidden.ok) {
        throw new Error(`Forbidden move: ${forbidden.reason}`);
      }

      const winnerDetected = isWin(updatedBoard, idx, playerColor);
      const moveCount = data.moveCount + 1;
      const payload: Partial<Room> = {
        board: updatedBoard,
        lastMove: { idx, by: playerColor, at: serverTimestamp() },
        moveCount,
        moves: [...data.moves, idx],
      } as Partial<Room>;

      if (winnerDetected) {
        payload.status = 'finished';
        payload.winner = playerColor;
        payload.finishedAt = serverTimestamp();
      } else if (moveCount >= BOARD_SIZE * BOARD_SIZE) {
        payload.status = 'finished';
        payload.winner = 'draw';
        payload.finishedAt = serverTimestamp();
      } else {
        payload.turn = playerColor === 'B' ? 'W' : 'B';
      }

      transaction.update(roomRef, payload);
    });
  };

  const handleSendChat = async (text: string) => {
    if (!roomId || !auth.currentUser || !room) return;
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const data = snap.data() as Room;
    const uid = auth.currentUser.uid;
    if (data.players.B?.uid !== uid && data.players.W?.uid !== uid) throw new Error('Not a player');
    await addDoc(collection(db, 'rooms', roomId, 'chat'), {
      uid,
      nickname: auth.currentUser.displayName || 'Player',
      text,
      createdAt: serverTimestamp(),
    });
  };

  const isWinner = room?.winner && auth.currentUser &&
    ((room.winner === 'B' && room.players.B?.uid === auth.currentUser.uid) ||
      (room.winner === 'W' && room.players.W?.uid === auth.currentUser.uid));

  const handleReviewSave = async () => {
    if (!roomId || !room?.winner || !isWinner) return;
    const matchRef = doc(db, 'matches', roomId);
    await setDoc(matchRef, { winnerReview: reviewText.trim() || null }, { merge: true });
    setReviewText('');
  };

  if (!roomId) return <div className="p-4">Invalid room.</div>;
  if (!room) return <div className="p-4">Loading room...</div>;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-semibold">Room {roomId}</div>
          <div className="text-sm text-slate-600">Status: {room.status}</div>
          {statusMessage && <div className="text-red-600 text-sm">{statusMessage}</div>}
        </div>
        <button className="text-blue-600 underline" onClick={() => navigate('/lobby')}>
          Back to lobby
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-3 rounded-lg shadow space-y-2">
            <div className="flex justify-between text-sm text-slate-700">
              <div>Black: {room.players.B?.nickname ?? 'Waiting'}</div>
              <div>White: {room.players.W?.nickname ?? 'Waiting'}</div>
            </div>
            <Board
              board={room.board}
              lastMove={room.lastMove?.idx}
              disabled={room.status !== 'playing'}
              onPlay={handlePlay}
              myColor={myColor}
              turn={room.turn}
            />
          </div>

          {room.status === 'finished' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 space-y-2">
              <div className="font-semibold text-emerald-700">Game finished</div>
              <div>
                Winner:{' '}
                {room.winner === 'draw'
                  ? 'Draw'
                  : room.winner === 'B'
                    ? room.players.B?.nickname ?? 'Black'
                    : room.players.W?.nickname ?? 'White'}
              </div>
              {isWinner && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-700">Leave a one-line review</div>
                  <textarea
                    className="w-full border rounded px-2 py-1"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={60}
                  />
                  <button
                    className="px-3 py-1 bg-emerald-600 text-white rounded"
                    onClick={handleReviewSave}
                  >
                    Save review
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Chat messages={chatMessages} onSend={handleSendChat} disabled={!myColor} />
          <HistoryList matches={matches} title="Latest matches" />
        </div>
      </div>
    </div>
  );
}
