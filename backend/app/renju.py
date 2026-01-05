from __future__ import annotations
from typing import List, Tuple

SIZE = 15
DIRECTIONS = [1, SIZE, SIZE - 1, SIZE + 1]


def index_to_coord(idx: int) -> Tuple[int, int]:
    return divmod(idx, SIZE)


def in_bounds(r: int, c: int) -> bool:
    return 0 <= r < SIZE and 0 <= c < SIZE


def apply_move(board: List[str], idx: int, color: str) -> List[str]:
    if board[idx] != ".":
        raise ValueError("Position already filled")
    new_board = board.copy()
    new_board[idx] = color
    return new_board


def count_run(board: List[str], idx: int, color: str, direction: int) -> Tuple[int, int, bool, bool]:
    row, col = index_to_coord(idx)
    dr, dc = divmod(direction, SIZE)
    # adjust for diagonal directions
    if direction == SIZE - 1:
        dr, dc = 1, -1
    elif direction == SIZE + 1:
        dr, dc = 1, 1
    left = 0
    r, c = row - dr, col - dc
    while in_bounds(r, c) and board[r * SIZE + c] == color:
        left += 1
        r -= dr
        c -= dc
    left_open = in_bounds(r, c) and board[r * SIZE + c] == "."

    right = 0
    r, c = row + dr, col + dc
    while in_bounds(r, c) and board[r * SIZE + c] == color:
        right += 1
        r += dr
        c += dc
    right_open = in_bounds(r, c) and board[r * SIZE + c] == "."

    return left + right + 1, left, right, left_open, right_open


def is_overline(board: List[str], idx: int, color: str) -> bool:
    for direction in DIRECTIONS:
        run, *_ = count_run(board, idx, color, direction)
        if run >= 6:
            return True
    return False


def _line_window(board: List[str], idx: int, direction: int) -> List[str]:
    row, col = index_to_coord(idx)
    dr, dc = divmod(direction, SIZE)
    if direction == SIZE - 1:
        dr, dc = 1, -1
    elif direction == SIZE + 1:
        dr, dc = 1, 1
    cells: List[str] = []
    r, c = row - dr * 4, col - dc * 4
    for _ in range(9):
        if in_bounds(r, c):
            cells.append(board[r * SIZE + c])
        else:
            cells.append("X")
        r += dr
        c += dc
    return cells


def count_open_threes(board: List[str], idx: int, color: str) -> int:
    total = 0
    for direction in DIRECTIONS:
        run, left, right, left_open, right_open = count_run(board, idx, color, direction)
        if run >= 4:
            continue
        if run == 3 and left_open and right_open:
            total += 2  # two separate extensions
        elif run == 2 and left_open and right_open:
            total += 1
    return total


def count_open_fours(board: List[str], idx: int, color: str) -> int:
    total = 0
    for direction in DIRECTIONS:
        run, left, right, left_open, right_open = count_run(board, idx, color, direction)
        if run >= 5:
            continue
        if run == 4 and left_open and right_open:
            total += 2
        elif run == 3 and left_open and right_open:
            total += 1
    return total


def check_forbidden(board: List[str], idx: int) -> Tuple[bool, str | None]:
    temp_board = apply_move(board, idx, "B")
    if is_overline(temp_board, idx, "B"):
        return True, "overline"
    threes = count_open_threes(temp_board, idx, "B")
    if threes >= 2:
        return True, "double-three"
    fours = count_open_fours(temp_board, idx, "B")
    if fours >= 2:
        return True, "double-four"
    return False, None


def check_victory(board: List[str], idx: int, color: str) -> bool:
    for direction in DIRECTIONS:
        run, *_ = count_run(board, idx, color, direction)
        if color == "B":
            if run == 5:
                return True
        else:
            if run >= 5:
                return True
    return False


def is_draw(board: List[str]) -> bool:
    return all(cell != "." for cell in board)
