"use client";

import { useState } from "react";
import Board from "../../components/Board";
import DigitPad from "../../components/DigitPad";
import SecretEntry from "../../components/SecretEntry";
import { BullsColumn, Notes, SecretsGrid, Verdict } from "../../components/panels";
import { Button, PlayArea, ScoreBar, Sheet, StatusLine, useToast } from "../../components/ui";
import { blankNotes, isValidCode, nextNote, type Note } from "../../lib/bulls";
import { BACK, ENTER, digitFromEvent } from "../../lib/keys";
import { isRecord, persisted } from "../../lib/persist";
import { MOVES, plural } from "../../lib/plural";
import { other } from "../../lib/turns";
import { useKeys } from "../../lib/useKeys";
import { AllGamesLink, OpponentAway, Waiting, playerNames, type GameProps } from "./shared";

/** This player's digit notes per room and round; they never leave the browser. */
const notesStore = persisted<Record<string, Note[]>>("games:online-notes", {}, (raw) => (isRecord(raw) ? (raw as Record<string, Note[]>) : null));

function saveNotes(key: string, notes: Note[]) {
  notesStore.set((prev) => {
    const next = { ...prev, [key]: notes };
    const keys = Object.keys(next);
    keys.slice(0, Math.max(0, keys.length - 20)).forEach((k) => delete next[k]);
    return next;
  });
}

/** Bulls and cows online: both crack their number at the same time. */
export default function OnlineBulls({ room, view }: GameProps<"bulls">) {
  const s = view.state;
  const { length } = view.settings;
  const me = view.me;
  const opp = other(me);
  const names = playerNames(view);

  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(0);
  const [resultClosed, setResultClosed] = useState(false);
  const [toast, showToast] = useToast();
  const notesKey = `${view.code}:${s.round}`;
  const notes = notesStore.use()[notesKey] ?? blankNotes();

  const over = s.phase === "over";
  const mine = s.boards[me];
  const done = mine.at(-1)?.bulls === length;

  const reject = (message: string) => {
    showToast(message);
    setShake((n) => n + 1);
  };

  const submit = async () => {
    if (room.pending) return;
    if (!isValidCode(current, length)) return reject(current.length < length ? "Мало цифр" : "Цифры не должны повторяться");
    const error = await room.act({ type: "guess", value: current });
    if (error) reject(error);
    else setCurrent("");
  };

  const press = (key: string) => {
    if (over || done || room.pending) return;
    if (key === ENTER) return void submit();
    if (key === BACK) setCurrent((c) => c.slice(0, -1));
    else setCurrent((c) => (c.length < length && !c.includes(key) ? c + key : c));
  };

  useKeys(press, digitFromEvent, s.phase === "play" && !done);

  const rematch = async () => {
    const error = await room.act({ type: "next", round: s.round });
    if (error) showToast(error);
  };

  if (s.phase === "secret") {
    return s.ready[opp] ? (
      <Waiting title="Число загадано">
        <p>
          <b className="font-mono tracking-wider text-wg-text">{s.secrets[opp]}</b> — его будет отгадывать {names[opp]}.
        </p>
        <p className="mt-1">Ждём, пока {names[opp]} загадает число для тебя…</p>
      </Waiting>
    ) : (
      <>
        <SecretEntry
          kind={{ type: "code", length }}
          seat={me}
          title="Загадай число"
          onSubmit={async (code) => {
            const error = await room.act({ type: "secret", value: code });
            if (error) showToast(error);
          }}
        >
          {length} {plural(length, ["разная цифра", "разные цифры", "разных цифр"])}. Отгадывать будет{" "}
          <b className="text-wg-text">{names[opp]}</b>.
        </SecretEntry>
        {toast && <StatusLine toast={toast} />}
      </>
    );
  }

  const tries = s.winner !== null ? s.boards[s.winner].length : s.boards[0].length;

  return (
    <PlayArea>
      <ScoreBar names={names} score={s.score} turn={null} />
      <OpponentAway room={room} view={view} />
      <div className="flex min-h-0 flex-1 gap-2 px-3 pt-3 sm:gap-6 sm:px-6">
        {([0, 1] as const).map((seat) => (
          <BullsColumn
            key={seat}
            seat={seat}
            name={seat === me ? `${names[seat]} (ты)` : names[seat]}
            guesses={s.boards[seat]}
            active={!over && seat === me && !done}
            dim={!over && seat !== me}
            badge={
              seat === opp && !over && s.boards[seat].length > 0
                ? s.boards[seat].at(-1)?.bulls === length
                  ? "✓"
                  : `${s.boards[seat].length} ${plural(s.boards[seat].length, MOVES)}`
                : undefined
            }
            footer={
              s.secrets[seat] && (
                <>
                  Число: <b className="font-mono tracking-wider text-wg-text">{s.secrets[seat]}</b>
                </>
              )
            }
          />
        ))}
      </div>
      <StatusLine toast={toast}>
        {over ? null : done ? `Все быки! Ждём: ${names[opp]}` : `Ход ${mine.length + 1}`}
      </StatusLine>
      <div className="shrink-0 space-y-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {over ? (
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-3">
            <Button variant="secondary" onClick={() => setResultClosed(false)}>
              Итоги
            </Button>
            <Button onClick={rematch} disabled={room.pending}>
              Реванш
            </Button>
          </div>
        ) : (
          <div className={`wg-p${me} space-y-2`}>
            <div className="mx-auto h-[clamp(44px,12vw,56px)] w-[min(70vw,260px)]">
              <div className="wg-fit size-full">
                <Board guesses={[]} rows={1} cols={length} active current={current} shake={shake} maxWidth={260} />
              </div>
            </div>
            <Notes
              notes={notes}
              onToggle={(d) => saveNotes(notesKey, notes.map((n, i) => (i === d ? nextNote(n) : n)))}
            />
            <DigitPad onKey={press} used={current} disabled={done} />
          </div>
        )}
      </div>
      <Sheet open={over && !resultClosed} onClose={() => setResultClosed(true)}>
        <div className="text-center">
          <Verdict winner={s.winner} names={names}>
            {s.winner !== null ? "Число отгадано" : "Оба числа отгаданы"} за {tries} {plural(tries, MOVES)}
          </Verdict>
          <SecretsGrid caption="Какие числа искали" names={names} secrets={s.secrets} mono />
          <p className="mt-4 font-wg-display text-lg font-extrabold tabular-nums">
            {s.score[0]} : {s.score[1]}
          </p>
          <div className="mt-4 grid gap-2">
            <Button onClick={rematch} disabled={room.pending}>
              Реванш
            </Button>
            <AllGamesLink />
          </div>
        </div>
      </Sheet>
    </PlayArea>
  );
}
