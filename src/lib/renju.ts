import { PlayerColor, Stone } from '../types';

export const BOARD_SIZE = 15;
export const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;

const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function boardToArray(board: string): Stone[] {
  if (board.length !== BOARD_CELLS) {
    throw new Error('Invalid board length');
  }
  return board.split('') as Stone[];
}

export function setStone(board: string, idx: number, color: PlayerColor): string {
  const arr = boardToArray(board);
  arr[idx] = color;
  return arr.join('');
}

function coordFromIdx(idx: number) {
  const row = Math.floor(idx / BOARD_SIZE);
  const col = idx % BOARD_SIZE;
  return { row, col };
}

function idxFromCoord(row: number, col: number) {
  return row * BOARD_SIZE + col;
}

function inBounds(row: number, col: number) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function countLine(board: string, idx: number, color: PlayerColor, dir: [number, number]) {
  const { row, col } = coordFromIdx(idx);
  let total = 1;
  for (const sign of [1, -1]) {
    let r = row + dir[0] * sign;
    let c = col + dir[1] * sign;
    while (inBounds(r, c) && board[idxFromCoord(r, c)] === color) {
      total += 1;
      r += dir[0] * sign;
      c += dir[1] * sign;
    }
  }
  return total;
}

export function isWin(board: string, idx: number, color: PlayerColor) {
  for (const dir of directions) {
    const length = countLine(board, idx, color, dir);
    if (color === 'B') {
      if (length === 5) return true;
    } else if (length >= 5) {
      return true;
    }
  }
  return false;
}

function hasOverline(board: string, idx: number, color: PlayerColor) {
  if (color !== 'B') return false;
  return directions.some((dir) => countLine(board, idx, color, dir) > 5);
}

function extractLine(board: string, idx: number, dir: [number, number]) {
  const { row, col } = coordFromIdx(idx);
  let r = row;
  let c = col;
  while (inBounds(r - dir[0], c - dir[1])) {
    r -= dir[0];
    c -= dir[1];
  }
  const chars: Stone[] = [];
  let position = 0;
  while (inBounds(r, c)) {
    chars.push(board[idxFromCoord(r, c)] as Stone);
    if (r === row && c === col) {
      position = chars.length - 1;
    }
    r += dir[0];
    c += dir[1];
  }
  return { line: chars.join(''), position };
}

function countOpenFours(board: string, idx: number, color: PlayerColor) {
  const patterns = [/\.BBBB\./g, /\.BBB\.B\./g, /\.B\.BBB\./g, /\.BB\.BB\./g];
  let total = 0;
  directions.forEach((dir) => {
    const { line } = extractLine(board, idx, dir);
    patterns.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        total += matches.length;
      }
    });
  });
  return total;
}

function countOpenThrees(board: string, idx: number, color: PlayerColor) {
  const patterns = [/\.BB\.\./g, /\.B\.B\./g, /\.BBB\.\./g, /\.\.BBB\./g];
  let total = 0;
  directions.forEach((dir) => {
    const { line } = extractLine(board, idx, dir);
    patterns.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        total += matches.length;
      }
    });
  });
  return total;
}

export function checkRenjuForbidden(board: string, idx: number, color: PlayerColor) {
  if (color === 'W') return { ok: true } as const;
  const overline = hasOverline(board, idx, color);
  if (overline) {
    return { ok: false, reason: 'overline' } as const;
  }
  const openFours = countOpenFours(board, idx, color);
  if (openFours >= 2) {
    return { ok: false, reason: 'double-four' } as const;
  }
  const openThrees = countOpenThrees(board, idx, color);
  if (openThrees >= 2) {
    return { ok: false, reason: 'double-three' } as const;
  }
  return { ok: true } as const;
}

export function emptyBoard() {
  return '.'.repeat(BOARD_CELLS);
}
