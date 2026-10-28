"use client";

import { useState } from "react";
import Board from "../../components/Board";
import Keyboard from "../../components/Keyboard";
import SecretEntry from "../../components/SecretEntry";
import { BoardPanel, SecretsGrid, Verdict } from "../../components/panels";
import { Button, PlayArea, ScoreBar, Sheet, StatusLine, useToast } from "../../components/ui";
import { isSolved, keyStates } from "../../lib/evaluate";
import { BACK, ENTER, keyFromEvent } from "../../lib/keys";
import { MOVES, plural } from "../../lib/plural";
import { other } from "../../lib/turns";
import { useKeys } from "../../lib/useKeys";
import { MAX_GUESSES, WORD_LENGTH } from "../../lib/words";
import { AllGamesLink, OpponentAway, Waiting, playerNames, type GameProps } from "./shared";
import { newRow } from "./useRoom";

/** Wordle duel online: both look for their word at the same time. */
export default function OnlineDuel({ room, view }: GameProps<"duel">) {
  const s = view.state;
  const { lang } = view.settings;
  const me = view.me;
  const opp = other(me);
  const names = playerNames(view);

  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(0);
  const [resultClosed, setResultClosed] = useState(false);
  const [toast, showToast] = useToast();

  const over = s.phase === "over";
  const mine = s.boards[me];
  const done = isSolved(mine.at(-1)) || mine.length >= MAX_GUESSES;
  const before = room.prev?.game === "duel" && room.prev.state.round === s.round ? room.prev.state.boards : null;

  const reject = (message: string) => {
    showToast(message);
    setShake((n) => n + 1);
  };

  const submit = async () => {
    if (room.pending) return;
    if (current.length < WORD_LENGTH) return reject("Мало букв");
    const error = await room.act({ type: "guess", value: current });
    if (error) reject(error);
    else setCurrent("");
  };

  const press = (key: string) => {
    if (over || done || room.pending) return;
    if (key === ENTER) return void submit();
    if (key === BACK) setCurrent((c) => c.slice(0, -1));
    else setCurrent((c) => (c.length < WORD_LENGTH ? c + key : c));
  };

  useKeys(press, (e) => keyFromEvent(e, lang), s.phase === "play" && !done);

  const rematch = async () => {
    const error = await room.act({ type: "next", round: s.round });
    if (error) showToast(error);
  };

  if (s.phase === "secret") {
    return s.ready[opp] ? (
      <Waiting title="Слово загадано">
        <p>
          <b className="uppercase tracking-wider text-wg-text">{s.secrets[opp]}</b> — его будет искать {names[opp]}.
        </p>
        <p className="mt-1">Ждём, пока {names[opp]} загадает слово для тебя…</p>
      </Waiting>
    ) : (
      <>
        <SecretEntry
          kind={{ type: "word", lang }}
          seat={me}
          title="Загадай слово"
          onSubmit={async (word) => {
            const error = await room.act({ type: "secret", value: word });
            if (error) showToast(error);
          }}
        >
          Его будет угадывать <b className="text-wg-text">{names[opp]}</b>.
        </SecretEntry>
        {toast && <StatusLine toast={toast} />}
      </>
    );
  }

  const tries = s.winner !== null ? s.boards[s.winner].length : s.boards[0].length;
  const bothSolved = s.winner === null && isSolved(s.boards[0].at(-1));
  const status = over
    ? null
    : done
      ? `${isSolved(mine.at(-1)) ? "Твоё слово найдено!" : "Попытки закончились."} Ждём: ${names[opp]}`
      : `Попытка ${mine.length + 1} из ${MAX_GUESSES}`;

  return (
    <PlayArea>
      <ScoreBar names={names} score={s.score} turn={null} />
      <OpponentAway room={room} view={view} />
      <div className="flex min-h-0 flex-1 gap-3 px-3 pt-3 sm:gap-10 sm:px-6">
        {([0, 1] as const).map((seat) => {
          const typing = seat === me && !over && !done;
          const boardTries = s.boards[seat].length;
          return (
            <BoardPanel
              key={seat}
              seat={seat}
              name={seat === me ? `${names[seat]} (ты)` : names[seat]}
              dim={!over && seat !== me}
              withFooter={s.secrets.some(Boolean)}
              badge={
                seat === opp && !over
                  ? isSolved(s.boards[seat].at(-1))
                    ? "✓"
                    : `${boardTries}/${MAX_GUESSES}`
                  : undefined
              }
              footer={
                s.secrets[seat] && (
                  <>
                    Слово: <b className="uppercase tracking-wider text-wg-text">{s.secrets[seat]}</b>
                  </>
                )
              }
            >
              <Board
                guesses={s.boards[seat]}
                active={typing}
                current={current}
                revealRow={newRow(boardTries, before?.[seat].length)}
                shake={typing ? shake : 0}
                label={`Попытки: ${names[seat]}`}
              />
            </BoardPanel>
          );
        })}
      </div>
      <StatusLine toast={toast}>{status}</StatusLine>
      <div className="shrink-0 pb-[max(8px,env(safe-area-inset-bottom))]">
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
          <div className={`wg-p${me}`}>
            <Keyboard lang={lang} states={keyStates(mine)} onKey={press} disabled={done} />
          </div>
        )}
      </div>
      <Sheet open={over && !resultClosed} onClose={() => setResultClosed(true)}>
        <div className="text-center">
          <Verdict winner={s.winner} names={names}>
            {s.winner !== null || bothSolved
              ? `${bothSolved ? "Оба слова найдены" : "Слово найдено"} за ${tries} ${plural(tries, MOVES)}`
              : "Ни одно слово не найдено"}
          </Verdict>
          <SecretsGrid caption="Какие слова искали" names={names} secrets={s.secrets} />
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
