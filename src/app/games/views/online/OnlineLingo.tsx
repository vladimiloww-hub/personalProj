"use client";

import { useState } from "react";
import Board from "../../components/Board";
import Keyboard from "../../components/Keyboard";
import { WordTiles } from "../../components/panels";
import { Button, PlayArea, ScoreBar, Sheet, StatusLine, useToast } from "../../components/ui";
import { keyStates } from "../../lib/evaluate";
import { BACK, ENTER, keyFromEvent } from "../../lib/keys";
import { other, type Seat } from "../../lib/turns";
import { useKeys } from "../../lib/useKeys";
import { MAX_GUESSES, WORD_LENGTH } from "../../lib/words";
import { AllGamesLink, OpponentAway, playerNames, type GameProps } from "./shared";
import { newRow } from "./useRoom";

/** The shared board online: one word, turns go back and forth. */
export default function OnlineLingo({ room, view }: GameProps<"lingo">) {
  const s = view.state;
  const { lang, rounds } = view.settings;
  const me = view.me;
  const names = playerNames(view);

  const [typed, setTyped] = useState("");
  const [shake, setShake] = useState(0);
  const [resultClosed, setResultClosed] = useState(false);
  const [toast, showToast] = useToast();

  const playing = s.phase === "play";
  const myTurn = playing && s.turn === me;
  const prefix = s.first ?? "";
  const current = prefix + typed;
  const hints = Array.from({ length: WORD_LENGTH }, (_, i) =>
    i === 0 && prefix ? prefix : s.guesses.find((g) => g.marks[i] === "correct")?.word[i],
  );
  const before = room.prev?.game === "lingo" && room.prev.state.round === s.round ? room.prev.state.guesses.length : undefined;

  const reject = (message: string) => {
    showToast(message);
    setShake((n) => n + 1);
  };

  const submit = async () => {
    if (room.pending) return;
    if (current.length < WORD_LENGTH) return reject("Мало букв");
    const error = await room.act({ type: "guess", value: current });
    if (error) reject(error);
    else setTyped("");
  };

  const press = (key: string) => {
    if (!myTurn || room.pending) return;
    if (key === ENTER) return void submit();
    if (key === BACK) setTyped((t) => t.slice(0, -1));
    else setTyped((t) => (prefix.length + t.length < WORD_LENGTH ? t + key : t));
  };

  useKeys(press, (e) => keyFromEvent(e, lang), myTurn);

  const next = async () => {
    const error = await room.act({ type: "next", round: s.round });
    if (error) showToast(error);
  };

  const over = s.phase === "over";
  const matchWinner: Seat | null = s.score[0] === s.score[1] ? null : s.score[0] > s.score[1] ? 0 : 1;

  return (
    <PlayArea>
      <ScoreBar names={names} score={s.score} turn={playing ? s.turn : null} />
      <OpponentAway room={room} view={view} />
      <p className="shrink-0 pt-2 text-center text-[13px] font-semibold text-wg-muted">
        Раунд {s.round} из {rounds}
      </p>
      <div className="flex min-h-0 flex-1 px-6 pt-2">
        <div className="wg-fit">
          <Board
            guesses={s.guesses}
            active={myTurn}
            current={current}
            hints={hints}
            revealRow={newRow(s.guesses.length, before)}
            shake={shake}
            rowSeats={s.guesses.map((g) => g.by)}
            maxWidth={360}
            label="Общая доска"
          />
        </div>
      </div>
      <StatusLine toast={toast}>
        {playing
          ? myTurn
            ? `Твой ход · попытка ${s.guesses.length + 1} из ${MAX_GUESSES}`
            : `Ходит ${names[s.turn]}…`
          : s.answer && `Слово: «${s.answer.toUpperCase()}»`}
      </StatusLine>
      <div className="shrink-0 pb-[max(8px,env(safe-area-inset-bottom))]">
        {playing ? (
          <div className={`wg-p${me} transition-opacity ${myTurn ? "" : "opacity-50"}`}>
            <Keyboard lang={lang} states={keyStates(s.guesses)} onKey={press} disabled={!myTurn} />
          </div>
        ) : (
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-3">
            <Button variant="secondary" onClick={() => setResultClosed(false)}>
              Итоги
            </Button>
            <Button onClick={next} disabled={room.pending}>
              {over ? "Ещё матч" : "Дальше"}
            </Button>
          </div>
        )}
      </div>
      <Sheet open={!playing && !resultClosed} onClose={() => setResultClosed(true)}>
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-wg-muted">
            {over ? "Матч окончен" : `Раунд ${s.round} из ${rounds}`}
          </p>
          {over ? (
            <p className={`${matchWinner !== null ? `wg-p${matchWinner} text-wg-pc` : ""} mt-1 font-wg-display text-3xl font-extrabold`}>
              {matchWinner !== null ? `Победа: ${names[matchWinner]}` : "Ничья"}
            </p>
          ) : (
            <p className={`${s.roundWinner !== null ? `wg-p${s.roundWinner} text-wg-pc` : ""} mt-1 font-wg-display text-2xl font-extrabold`}>
              {s.roundWinner !== null ? `Очко: ${names[s.roundWinner]}` : "Никто не угадал"}
            </p>
          )}
          {s.answer && <WordTiles word={s.answer} />}
          <div className="mt-5 flex items-center justify-center gap-4">
            {([0, 1] as const).map((seat) => (
              <div key={seat} className={`wg-p${seat} min-w-0 flex-1 rounded-xl bg-wg-surface-2 p-3`}>
                <p className="truncate text-[13px] font-semibold text-wg-pc">
                  {names[seat]}
                  {seat === me && " (ты)"}
                </p>
                <p className="font-wg-display text-2xl font-extrabold tabular-nums">{s.score[seat]}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2">
            <Button onClick={next} disabled={room.pending}>
              {over ? "Ещё матч" : `Раунд ${s.round + 1}`}
            </Button>
            <p className="text-[13px] text-wg-muted">
              {over ? "Новый матч начнётся у обоих" : `Следующий раунд откроется у обоих; первым ходит ${names[other(s.starter)]}`}
            </p>
            <AllGamesLink />
          </div>
        </div>
      </Sheet>
    </PlayArea>
  );
}
