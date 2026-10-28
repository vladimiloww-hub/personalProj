"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShareIcon } from "../../components/icons";
import { Button, GameScreen, Legend, Page, RulesButton, TopBar } from "../../components/ui";
import { DEFAULT_NAMES, NAME_MAX, cleanName, playerNames } from "../../lib/players";
import { plural } from "../../lib/plural";
import { copyText, shareOrCopy } from "../../lib/share";
import { GAME_TITLES, type RoomView } from "../../lib/online/types";
import { LANGS, MAX_GUESSES, WORD_LENGTH } from "../../lib/words";
import OnlineBulls from "./OnlineBulls";
import OnlineDuel from "./OnlineDuel";
import OnlineLingo from "./OnlineLingo";
import type { ViewOf } from "./shared";
import { useRoom, type RoomHandle } from "./useRoom";

/** /games/room/[code]: joining, the lobby and the game itself. */
export default function OnlineRoom({ code }: { code: string }) {
  const room = useRoom(code);
  const { view, error } = room;
  const title = view ? GAME_TITLES[view.game] : "Онлайн-игра";

  let body;
  if (!view)
    body = error ? (
      <Missing message={error.message} hint={error.status === 404 ? CHECK_CODE : TRY_LATER} />
    ) : (
      <p className="flex flex-1 items-center justify-center gap-2 text-[15px] text-wg-muted">
        <span className="wg-turn size-2.5 rounded-full bg-wg-muted" aria-hidden />
        Подключаемся…
      </p>
    );
  else if (view.me === null)
    body = view.names[1] ? <Missing message="В этой комнате уже играют двое" hint={CHECK_CODE} /> : <Join room={room} view={view} />;
  else if (view.state.phase === "lobby") body = <Lobby code={view.code} />;
  else body = <Game room={room} view={view as ViewOf<RoomView["game"]>} />;

  return (
    <GameScreen>
      <TopBar title={title} right={view && <Rules view={view} />} />
      {view && error && error.status !== 400 && (
        <p className="shrink-0 bg-wg-present/15 px-4 py-1.5 text-center text-[13px] font-medium" role="status">
          {error.status === 0 ? "Нет связи — пробуем снова…" : error.message}
        </p>
      )}
      {body}
    </GameScreen>
  );
}

function Game({ room, view }: { room: RoomHandle; view: ViewOf<RoomView["game"]> }) {
  // Keyed by round so per-round bits (typed letters, a closed result) start fresh.
  switch (view.game) {
    case "duel":
      return <OnlineDuel key={view.state.round} room={room} view={view} />;
    case "bulls":
      return <OnlineBulls key={view.state.round} room={room} view={view} />;
    case "lingo":
      return <OnlineLingo key={view.state.round} room={room} view={view} />;
  }
}

function settingsLine(view: RoomView): string {
  const lang = (l: string) => LANGS.find((x) => x.id === l)?.label ?? l;
  const source = (s: string) => (s === "custom" ? "загадываете друг другу" : "случайные");
  switch (view.game) {
    case "duel":
      return `${lang(view.settings.lang)} слова · ${source(view.settings.source)}`;
    case "lingo":
      return `${lang(view.settings.lang)} слова · ${view.settings.rounds} ${plural(view.settings.rounds, ["раунд", "раунда", "раундов"])}${
        view.settings.firstLetter ? " · первая буква открыта" : ""
      }`;
    case "bulls":
      return `${view.settings.length} ${plural(view.settings.length, ["цифра", "цифры", "цифр"])} · ${source(view.settings.source)}`;
  }
}

const CHECK_CODE = "Проверь код комнаты — или начни новую игру.";
const TRY_LATER = "Попробуй обновить страницу чуть позже.";

function Missing({ message, hint }: { message: string; hint: string }) {
  return (
    <Page>
      <h2 className="font-wg-display text-2xl font-extrabold">{message}</h2>
      <p className="text-[15px] leading-relaxed text-wg-muted">{hint}</p>
      <Link href="/games" className="font-semibold underline underline-offset-4">
        Все игры
      </Link>
    </Page>
  );
}

function Join({ room, view }: { room: RoomHandle; view: RoomView }) {
  const names = playerNames.use();
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    const me = cleanName(names[0], DEFAULT_NAMES[0]);
    playerNames.set([me, names[1]]);
    setError(await room.join(me));
  };

  return (
    <Page>
      <div>
        <p className="text-[15px] text-wg-muted">
          <b className="wg-p0 text-wg-pc">{view.names[0]}</b> зовёт тебя сыграть
        </p>
        <h2 className="mt-1 font-wg-display text-3xl font-extrabold">{GAME_TITLES[view.game]}</h2>
        <p className="mt-2 text-[15px] text-wg-muted">{settingsLine(view)}</p>
      </div>
      <label className="wg-p1 block">
        <span className="mb-2 block text-[13px] font-semibold text-wg-muted">Твоё имя</span>
        <input
          value={names[0]}
          maxLength={NAME_MAX}
          onChange={(e) => playerNames.set([e.target.value, names[1]])}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder={DEFAULT_NAMES[1]}
          className="h-12 w-full rounded-xl border border-wg-line bg-wg-surface px-4 text-[15px] font-semibold outline-none transition focus:border-wg-pc"
        />
      </label>
      <Button onClick={join} disabled={room.pending}>
        Войти в игру
      </Button>
      {error && (
        <p role="alert" className="text-center text-sm font-semibold">
          {error}
        </p>
      )}
    </Page>
  );
}

function Lobby({ code }: { code: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [link, setLink] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/games/room/${code}`;
    let alive = true;
    import("qrcode")
      .then((QR) => QR.toDataURL(url, { margin: 1, width: 440, color: { dark: "#1c1b18", light: "#ffffff" } }))
      .then((data) => {
        if (!alive) return;
        setLink(url);
        setQr(data);
      })
      .catch(() => alive && setLink(url));
    return () => {
      alive = false;
    };
  }, [code]);

  const share = async () => {
    const outcome = await shareOrCopy({ title: "Сыграем?", text: `Заходи в игру — код ${code}`, url: link });
    setNote(outcome === "copied" ? "Скопировано — вставь в любой мессенджер" : outcome === "failed" ? "Не получилось скопировать" : null);
  };
  const copy = async () => setNote((await copyText(link)) === "copied" ? "Ссылка скопирована" : "Не получилось скопировать");

  return (
    <Page>
      <div className="text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-wg-muted">Код комнаты</p>
        <p className="mt-1 select-all font-wg-display text-[clamp(36px,12vw,52px)] font-extrabold tracking-[0.18em]">{code}</p>
      </div>
      <div className="mx-auto grid size-[min(64vw,240px)] place-items-center rounded-2xl bg-white p-3 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, nothing to optimise */}
        {qr && <img src={qr} alt="QR-код ссылки на комнату" className="size-full" />}
      </div>
      <p className="text-center text-[15px] leading-relaxed text-wg-muted">
        Покажи QR-код или отправь ссылку. Можно и просто продиктовать код — его вводят на странице игр.
      </p>
      <div className="grid gap-2">
        <Button onClick={share} disabled={!link}>
          <ShareIcon />
          Поделиться ссылкой
        </Button>
        <Button variant="secondary" onClick={copy} disabled={!link}>
          Скопировать ссылку
        </Button>
        {note && (
          <p role="status" className="text-center text-sm text-wg-muted">
            {note}
          </p>
        )}
      </div>
      <p className="flex items-center justify-center gap-2 text-[15px] font-semibold">
        <span className="wg-turn size-2.5 rounded-full bg-wg-correct" aria-hidden />
        Ждём второго игрока…
      </p>
    </Page>
  );
}

function Rules({ view }: { view: RoomView }) {
  if (view.game === "lingo") {
    return (
      <RulesButton title="Общая доска онлайн">
        <p>Одно слово из {WORD_LENGTH} букв на двоих, ходите по очереди — каждый со своего телефона. Попытки соперника появляются у тебя сразу.</p>
        <Legend />
        <p>Кто первым назовёт слово, получает очко. За {MAX_GUESSES} попыток никто не угадал — очко никому.</p>
      </RulesButton>
    );
  }
  const what = view.game === "duel" ? "слово" : "число";
  return (
    <RulesButton title={`${GAME_TITLES[view.game]} онлайн`}>
      <p>
        Каждый загадывает {what} для соперника (или выпадает случайное) и ищет своё — одновременно, ждать чужого хода не
        нужно.
      </p>
      {view.game === "duel" ? (
        <Legend />
      ) : (
        <p>
          <b className="text-wg-correct">Бык</b> — цифра на своём месте, <b className="text-wg-present">корова</b> — цифра
          есть, но в другом месте.
        </p>
      )}
      <p>Побеждает тот, кому понадобится меньше попыток. Если поровну — ничья.</p>
      <p className="text-wg-muted">Доска соперника тоже видна — на ней ищут твоё {what}.</p>
    </RulesButton>
  );
}
