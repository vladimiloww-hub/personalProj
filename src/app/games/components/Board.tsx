import type { CSSProperties } from "react";
import { isSolved, type Guess, type Mark } from "../lib/evaluate";
import type { Seat } from "../lib/turns";
import { MAX_GUESSES, WORD_LENGTH } from "../lib/words";

const MARK_LABEL: Record<Mark, string> = {
  correct: "на месте",
  present: "есть в слове",
  absent: "нет в слове",
};

interface BoardProps {
  guesses: Guess[];
  /** Letters typed into the next row, shown while `active`. */
  current?: string;
  active?: boolean;
  rows?: number;
  cols?: number;
  /** Row whose tiles flip open right now. */
  revealRow?: number;
  /** Changing this number shakes the row being typed (a rejected word). */
  shake?: number;
  /** Faded letters behind the empty tiles of the row being typed. */
  hints?: (string | undefined)[];
  /** Who played each row, drawn as a coloured dot (shared board). */
  rowSeats?: Seat[];
  /** Upper bound for the board width in px. */
  maxWidth?: number;
  label?: string;
}

export default function Board({
  guesses,
  current = "",
  active = false,
  rows = MAX_GUESSES,
  cols = WORD_LENGTH,
  revealRow,
  shake = 0,
  hints,
  rowSeats,
  maxWidth = 340,
  label,
}: BoardProps) {
  const style = { "--rows": rows, "--cols": cols, "--board-max": `${maxWidth}px` } as CSSProperties;
  const typed = Array.from(current);

  return (
    <div className="wg-board" style={style} role="group" aria-label={label}>
      {Array.from({ length: rows }, (_, r) => {
        const guess = guesses[r];
        const seat = rowSeats?.[r];
        const dot = seat !== undefined && <span className={`wg-row-dot wg-p${seat}`} aria-hidden />;

        if (guess) {
          const reveal = r === revealRow;
          const letters = Array.from(guess.word);
          return (
            <div key={r} className="wg-row" data-win={isSolved(guess) ? "" : undefined}>
              {dot}
              {letters.map((ch, i) => (
                <div
                  key={i}
                  className="wg-tile"
                  data-mark={guess.marks[i]}
                  data-reveal={reveal ? "" : undefined}
                  style={{ "--i": i } as CSSProperties}
                  aria-label={`${ch.toUpperCase()}, ${MARK_LABEL[guess.marks[i]]}`}
                >
                  {ch}
                </div>
              ))}
            </div>
          );
        }

        if (active && r === guesses.length) {
          return (
            <div key={`typing-${shake}`} className="wg-row" data-shake={shake ? "" : undefined} aria-live="polite">
              {Array.from({ length: cols }, (_, i) => {
                const ch = typed[i];
                const hint = !ch ? hints?.[i] : undefined;
                return (
                  <div
                    key={i}
                    className="wg-tile"
                    data-filled={ch ? "" : undefined}
                    data-hint={hint ? "" : undefined}
                  >
                    {ch ?? hint ?? ""}
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <div key={r} className="wg-row">
            {Array.from({ length: cols }, (_, i) => (
              <div key={i} className="wg-tile" />
            ))}
          </div>
        );
      })}
    </div>
  );
}
