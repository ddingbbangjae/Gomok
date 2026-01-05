import classNames from 'classnames';
import { PlayerColor } from '../types';
import { BOARD_SIZE, boardToArray } from '../lib/renju';

interface Props {
  board: string;
  lastMove?: number | null;
  disabled?: boolean;
  onPlay?: (idx: number) => void;
  myColor?: PlayerColor | null;
  turn?: PlayerColor | null;
}

export default function Board({ board, lastMove, disabled, onPlay, myColor, turn }: Props) {
  const cells = boardToArray(board);
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-slate-600">{`Board ${BOARD_SIZE}x${BOARD_SIZE}`} {myColor && turn && `| You: ${myColor} | Turn: ${turn}`}</div>
      <div
        className="grid bg-amber-100 p-2 rounded-lg shadow-inner"
        style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`, aspectRatio: '1 / 1' }}
      >
        {cells.map((stone, idx) => {
          const isLast = lastMove === idx;
          const canClick = !disabled && stone === '.' && onPlay;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => canClick && onPlay?.(idx)}
              className={classNames(
                'border border-amber-300 flex items-center justify-center text-lg font-semibold relative',
                {
                  'hover:bg-amber-200': canClick,
                },
              )}
            >
              {stone === '.' ? null : (
                <span
                  className={classNames('rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6', {
                    'bg-black': stone === 'B',
                    'bg-white border border-slate-500': stone === 'W',
                  })}
                />
              )}
              {isLast && <span className="absolute inset-0 border border-red-500 pointer-events-none" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
