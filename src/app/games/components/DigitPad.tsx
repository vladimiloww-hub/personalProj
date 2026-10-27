import { BACK, ENTER } from "../lib/keys";
import { BackIcon, EnterIcon } from "./icons";

interface DigitPadProps {
  onKey: (key: string) => void;
  /** Digits that can't be typed right now (already in the number). */
  used?: string;
  disabled?: boolean;
}

const ROWS = ["12345", "67890"];

export default function DigitPad({ onKey, used = "", disabled }: DigitPadProps) {
  const press = (k: string) => () => onKey(k);
  return (
    <div className="mx-auto grid w-full max-w-[420px] gap-[6px] px-1.5" role="group" aria-label="Цифры">
      {ROWS.map((row) => (
        <div key={row} className="grid grid-cols-5 gap-1.5">
          {Array.from(row).map((d) => (
            <button
              key={d}
              type="button"
              className="wg-key text-xl"
              disabled={disabled || used.includes(d)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={press(d)}
            >
              {d}
            </button>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          className="wg-key"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={press(BACK)}
          aria-label="Стереть"
        >
          <BackIcon />
        </button>
        <button
          type="button"
          className="wg-key"
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={press(ENTER)}
          aria-label="Ввод"
        >
          <EnterIcon />
        </button>
      </div>
    </div>
  );
}
