import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, checkRenjuForbidden, emptyBoard, isWin, setStone } from './renju';

function idx(row: number, col: number) {
  return row * BOARD_SIZE + col;
}

describe('renju forbidden', () => {
  it('blocks overline for black', () => {
    let board = emptyBoard();
    const row = 7;
    [0, 1, 2, 3, 4, 5].forEach((col) => {
      board = setStone(board, idx(row, col), 'B');
    });
    const placedIdx = idx(row, 5);
    const result = checkRenjuForbidden(board, placedIdx, 'B');
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: 'overline' });
  });

  it('blocks double-four for black', () => {
    let board = emptyBoard();
    const center = idx(7, 7);
    // horizontal open four .BBBB.
    [idx(7, 6), idx(7, 7), idx(7, 8), idx(7, 9)].forEach((i) => {
      board = setStone(board, i, 'B');
    });
    // vertical open four .BBBB.
    [idx(6, 7), idx(7, 7), idx(8, 7), idx(9, 7)].forEach((i) => {
      board = setStone(board, i, 'B');
    });
    const result = checkRenjuForbidden(board, center, 'B');
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: 'double-four' });
  });

  it('blocks double-three for black', () => {
    let board = emptyBoard();
    const center = idx(7, 7);
    [idx(7, 6), idx(7, 7), idx(7, 8)].forEach((i) => {
      board = setStone(board, i, 'B');
    });
    [idx(6, 7), idx(7, 7), idx(8, 7)].forEach((i) => {
      board = setStone(board, i, 'B');
    });
    const result = checkRenjuForbidden(board, center, 'B');
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: 'double-three' });
  });
});

describe('win conditions', () => {
  it('allows black exact five', () => {
    let board = emptyBoard();
    const row = 3;
    [0, 1, 2, 3, 4].forEach((col) => {
      board = setStone(board, idx(row, col), 'B');
    });
    const result = isWin(board, idx(row, 4), 'B');
    expect(result).toBe(true);
  });

  it('allows white over five', () => {
    let board = emptyBoard();
    const row = 10;
    [5, 6, 7, 8, 9, 10].forEach((col) => {
      board = setStone(board, idx(row, col), 'W');
    });
    const result = isWin(board, idx(row, 9), 'W');
    expect(result).toBe(true);
  });
});
