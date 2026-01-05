import pytest
from app.renju import apply_move, check_forbidden, check_victory, SIZE


def empty_board():
    return ["."] * (SIZE * SIZE)


def test_overline_forbidden():
    board = empty_board()
    # place sequence of five then attempt sixth
    positions = [112, 113, 114, 115, 116]
    for p in positions:
        board = apply_move(board, p, "B")
    forbidden, reason = check_forbidden(board, 117)
    assert forbidden
    assert reason == "overline"


def test_double_three_forbidden():
    board = empty_board()
    for p in [112, 114]:
        board = apply_move(board, p, "B")
    for p in [97, 127]:
        board = apply_move(board, p, "B")
    forbidden, reason = check_forbidden(board, 113)
    assert forbidden
    assert reason == "double-three"


def test_double_four_forbidden():
    board = empty_board()
    for p in [112, 113, 114]:
        board = apply_move(board, p, "B")
    for p in [82, 142]:
        board = apply_move(board, p, "B")
    forbidden, reason = check_forbidden(board, 115)
    assert forbidden
    assert reason == "double-four"


def test_black_exact_five_wins():
    board = empty_board()
    moves = [112, 113, 114, 115]
    for p in moves:
        board = apply_move(board, p, "B")
    board = apply_move(board, 116, "B")
    assert check_victory(board, 116, "B")


def test_white_five_or_more_wins():
    board = empty_board()
    moves = [112, 113, 114, 115, 116, 117]
    for p in moves:
        board = apply_move(board, p, "W")
    assert check_victory(board, 117, "W")
