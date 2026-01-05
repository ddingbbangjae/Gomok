import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocketState

from .config import settings
from .db import engine, Base, get_session
from .models import Match, WinnerEnum
from .schemas import RoomCreate, RoomJoin, MatchCreate, ReviewCreate, MatchBase
from .renju import apply_move, check_forbidden, check_victory, is_draw, SIZE

app = FastAPI()


@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


class ConnectionManager:
    def __init__(self):
        self.rooms: dict[str, dict] = {}
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections.setdefault(room_id, []).append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.connections and websocket in self.connections[room_id]:
            self.connections[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: dict):
        for ws in list(self.connections.get(room_id, [])):
            if ws.application_state == WebSocketState.CONNECTED:
                await ws.send_json(message)


manager = ConnectionManager()


def current_state(room):
    return {
        "room": room["id"],
        "board": "".join(room["board"]),
        "turn": room.get("turn"),
        "players": room.get("players", {}),
        "status": room.get("status"),
        "lastMove": room.get("lastMove"),
        "moves": room.get("moves", []),
        "matchId": str(room.get("match_id")) if room.get("match_id") else None,
    }


@app.post("/api/rooms")
async def create_room(payload: RoomCreate):
    room_id = uuid.uuid4().hex[:6]
    board = ["."] * (SIZE * SIZE)
    room = {
        "id": room_id,
        "board": board,
        "turn": "B",
        "players": {"B": {"nickname": payload.nickname}},
        "status": "waiting",
        "moves": [],
        "started_at": datetime.utcnow(),
    }
    manager.rooms[room_id] = room
    return {"roomId": room_id}


@app.post("/api/rooms/{room_id}/join")
async def join_room(room_id: str, payload: RoomJoin):
    room = manager.rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room["status"] == "finished":
        raise HTTPException(status_code=400, detail="Game finished")
    if room["players"].get("W"):
        raise HTTPException(status_code=400, detail="Room full")
    room["players"]["W"] = {"nickname": payload.nickname}
    room["status"] = "playing"
    return {"roomId": room_id}


@app.get("/api/rooms/{room_id}")
async def get_room(room_id: str):
    room = manager.rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return current_state(room)


@app.get("/api/matches")
async def list_matches(limit: int = 20, cursor: datetime | None = None, session: AsyncSession = Depends(get_session)):
    stmt = select(Match).order_by(Match.finished_at.desc()).limit(limit)
    if cursor:
        stmt = stmt.where(Match.finished_at < cursor)
    result = await session.execute(stmt)
    matches = result.scalars().all()
    return [MatchBase.model_validate(m) for m in matches]


@app.get("/api/matches/{match_id}")
async def get_match(match_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Not found")
    return MatchBase.model_validate(match)


@app.post("/api/matches/{match_id}/review")
async def add_review(match_id: uuid.UUID, payload: ReviewCreate, session: AsyncSession = Depends(get_session)):
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Not found")
    winner_color = match.winner.value
    if winner_color == "draw":
        raise HTTPException(status_code=400, detail="No winner")
    room = manager.rooms.get(match.room_id)
    allowed_id = None
    if room:
        player = room["players"].get(winner_color)
        if player:
            allowed_id = player.get("user_id")
    if allowed_id and allowed_id != payload.user_id:
        raise HTTPException(status_code=403, detail="Only winner can review")
    text = payload.text.strip()
    if len(text) > 60:
        raise HTTPException(status_code=400, detail="Too long")
    match.winner_review = text
    await session.commit()
    return {"ok": True}


@app.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str, nickname: str):
    room = manager.rooms.get(room_id)
    if not room:
        await websocket.close(code=4404)
        return
    await manager.connect(room_id, websocket)
    user_color = None
    if room["players"].get("B", {}).get("nickname") == nickname:
        user_color = "B"
    elif room["players"].get("W", {}).get("nickname") == nickname:
        user_color = "W"
    if user_color:
        room["players"][user_color]["user_id"] = user_id
    await websocket.send_json({"type": "state", **current_state(room)})
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type == "chat":
                await manager.broadcast(room_id, {"type": "chat", "nickname": nickname, "text": data.get("text"), "at": datetime.utcnow().isoformat()})
            elif msg_type == "leave":
                break
            elif msg_type == "move":
                idx = int(data.get("idx"))
                if room["status"] == "finished":
                    await websocket.send_json({"type": "error", "code": "finished", "message": "Game finished"})
                    continue
                if room.get("turn") != user_color:
                    await websocket.send_json({"type": "error", "code": "turn", "message": "Not your turn"})
                    continue
                if room["board"][idx] != ".":
                    await websocket.send_json({"type": "error", "code": "occupied", "message": "Cell filled"})
                    continue
                if user_color == "B":
                    forbidden, reason = check_forbidden(room["board"], idx)
                    if forbidden:
                        await websocket.send_json({"type": "error", "code": reason, "message": "Forbidden move"})
                        continue
                room["board"] = apply_move(room["board"], idx, user_color)
                room["moves"].append(idx)
                room["lastMove"] = {"idx": idx, "color": user_color}
                if check_victory(room["board"], idx, user_color):
                    room["status"] = "finished"
                    room["turn"] = None
                    winner = user_color
                elif is_draw(room["board"]):
                    room["status"] = "finished"
                    room["turn"] = None
                    winner = "draw"
                else:
                    winner = None
                    room["turn"] = "W" if user_color == "B" else "B"
                await manager.broadcast(room_id, {"type": "state", **current_state(room)})
                if winner:
                    await save_match(room, winner)
                    await manager.broadcast(room_id, {"type": "finished", "winner": winner, "matchId": str(room.get("match_id"))})
            else:
                await websocket.send_json({"type": "error", "code": "bad_message", "message": "Unknown message"})
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(room_id, websocket)


async def save_match(room: dict, winner: str):
    async with get_session() as session_gen:
        session = await session_gen.__anext__()
        match = Match(
            room_id=room["id"],
            black_nickname=room["players"].get("B", {}).get("nickname", ""),
            white_nickname=room["players"].get("W", {}).get("nickname", ""),
            winner=WinnerEnum.black if winner == "B" else WinnerEnum.white if winner == "W" else WinnerEnum.draw,
            started_at=room.get("started_at", datetime.utcnow()),
            finished_at=datetime.utcnow(),
            moves=room.get("moves", []),
            final_board="".join(room.get("board", [])),
        )
        session.add(match)
        await session.commit()
        room["match_id"] = match.id


# Static files (skip mounting if dist is missing to allow API-only local dev)
frontend_root = Path(settings.frontend_dist)
assets_dir = frontend_root / "assets"

if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index_path = frontend_root / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return HTMLResponse("Frontend build not found", status_code=503)
