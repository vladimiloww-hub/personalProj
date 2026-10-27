"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isValidCode, randomCode } from "../lib/bulls";
import { BACK, ENTER, digitFromEvent, keyFromEvent } from "../lib/keys";
import { plural } from "../lib/plural";
import type { Seat } from "../lib/turns";
import { useKeys } from "../lib/useKeys";
import { WORD_LENGTH, loadDict, randomAnswer, type Lang } from "../lib/words";
import Board from "./Board";
import DigitPad from "./DigitPad";
import Keyboard from "./Keyboard";
import { DiceIcon, EyeIcon } from "./icons";
import { Button, StatusLine, useToast } from "./ui";

type SecretKind = { type: "word"; lang: Lang } | { type: "code"; length: number };

interface SecretEntryProps {
  kind: SecretKind;
  seat?: Seat;
  title: ReactNode;
  children?: ReactNode;
  submitLabel?: string;
  onSubmit: (secret: string) => void;
}

/**
 * Typing a secret word or number for the opponent. It is masked by default,
 * so a glance at the screen gives nothing away; words missing from the
 * dictionary need a second confirmation.
 */
export default function SecretEntry({ kind, seat, title, children, submitLabel = "Загадать", onSubmit }: SecretEntryProps) {
  const isWord = kind.type === "word";
  const lang: Lang = isWord ? kind.lang : "en";
  const length = isWord ? WORD_LENGTH : kind.length;

  const [value, setValue] = useState("");
  const [hidden, setHidden] = useState(true);
  const [unknown, setUnknown] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (isWord) loadDict(lang).catch(() => {});
  }, [isWord, lang]);

  const reject = (message: string) => {
    showToast(message);
    setShake((n) => n + 1);
  };

  const submit = async () => {
    if (value.length < length) {
      return reject(isWord ? `Нужно ${length} букв` : `Нужно ${length} ${plural(length, ["цифра", "цифры", "цифр"])}`);
    }
    if (!isWord) {
      return isValidCode(value, length) ? onSubmit(value) : reject("Цифры не должны повторяться");
    }
    if (unknown === value) return onSubmit(value);
    try {
      const dict = await loadDict(lang);
      if (dict.allowed.has(value)) onSubmit(value);
      else setUnknown(value);
    } catch {
      reject("Не получилось загрузить словарь");
    }
  };

  const press = (key: string) => {
    if (key === ENTER) return void submit();
    setUnknown(null);
    if (key === BACK) setValue((v) => v.slice(0, -1));
    else setValue((v) => (v.length < length && (isWord || !v.includes(key)) ? v + key : v));
  };

  useKeys(press, (e) => (isWord ? keyFromEvent(e, lang) : digitFromEvent(e)));

  const random = async () => {
    setUnknown(null);
    if (!isWord) return setValue(randomCode(length));
    try {
      setValue(randomAnswer(await loadDict(lang)));
    } catch {
      reject("Не получилось загрузить словарь");
    }
  };

  return (
    <div className={`${seat !== undefined ? `wg-p${seat}` : ""} flex min-h-0 flex-1 flex-col`}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-4 py-4 text-center">
        <div className="max-w-sm">
          <h2 className="font-wg-display text-xl font-extrabold leading-tight text-wg-pc">{title}</h2>
          {children && <div className="mt-2 text-[15px] leading-relaxed text-wg-muted">{children}</div>}
        </div>
        <div className="wg-fit h-[clamp(52px,15vw,68px)] w-full max-w-[380px] flex-none">
          <Board guesses={[]} rows={1} cols={length} active current={hidden ? "•".repeat(value.length) : value} shake={shake} />
        </div>
        <StatusLine toast={toast} />
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" className="h-10 px-4 text-sm" onClick={() => setHidden((h) => !h)}>
            <EyeIcon off={!hidden} />
            {hidden ? "Показать" : "Скрыть"}
          </Button>
          <Button variant="secondary" className="h-10 px-4 text-sm" onClick={random}>
            <DiceIcon />
            Случайное
          </Button>
        </div>
        {unknown && (
          <div className="w-full max-w-sm rounded-xl bg-wg-surface-2 p-3 text-sm leading-relaxed">
            <p>Такого слова нет в словаре. Его всё равно можно загадать — сопернику оно будет засчитано.</p>
            <Button variant="player" className="mt-2 h-10 w-full text-sm" onClick={() => onSubmit(unknown)}>
              Всё равно загадать
            </Button>
          </div>
        )}
      </div>
      <div className="shrink-0 space-y-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1">
        <div className="mx-auto w-full max-w-[540px] px-1.5">
          <Button variant="player" className="w-full" onClick={submit}>
            {submitLabel}
          </Button>
        </div>
        {isWord ? <Keyboard lang={lang} onKey={press} /> : <DigitPad onKey={press} used={value} />}
      </div>
    </div>
  );
}
