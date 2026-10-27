import type { Mark } from "../lib/evaluate";
import { BACK, ENTER, LAYOUTS } from "../lib/keys";
import type { Lang } from "../lib/words";
import { BackIcon, EnterIcon } from "./icons";

interface KeyboardProps {
  lang: Lang;
  states?: Record<string, Mark>;
  onKey: (key: string) => void;
  disabled?: boolean;
}

/**
 * On-screen letter keyboard. Rows sit on a grid of half-key columns so the
 * shorter middle row is centred and Enter/Backspace fill the last row.
 */
export default function Keyboard({ lang, states = {}, onKey, disabled }: KeyboardProps) {
  const rows = LAYOUTS[lang];
  const cols = rows[0].length * 2;

  return (
    <div className="mx-auto grid w-full max-w-[540px] gap-[6px] px-1.5" role="group" aria-label="Клавиатура">
      {rows.map((row, r) => {
        const letters = row.filter((k) => k !== ENTER && k !== BACK).length;
        const wide = (cols - letters * 2) / 2;
        const pad = row.length === letters ? (cols - letters * 2) / 2 : 0;
        return (
          <div key={r} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {row.map((k, i) => {
              const special = k === ENTER || k === BACK;
              const start = i === 0 && pad ? `${pad + 1} / ` : "";
              return (
                <button
                  key={k}
                  type="button"
                  className="wg-key"
                  style={{ gridColumn: `${start}span ${special ? wide : 2}` }}
                  data-mark={special ? undefined : states[k]}
                  disabled={disabled}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onKey(k)}
                  aria-label={k === ENTER ? "Ввод" : k === BACK ? "Стереть" : k}
                >
                  {k === ENTER ? <EnterIcon /> : k === BACK ? <BackIcon /> : k}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
