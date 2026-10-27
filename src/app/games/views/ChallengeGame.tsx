"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Board from "../components/Board";
import Keyboard from "../components/Keyboard";
import SecretEntry from "../components/SecretEntry";
import { ShareIcon } from "../components/icons";
import {
  Button,
  GameScreen,
  Page,
  PlayArea,
  RulesButton,
  Segmented,
  Sheet,
  StatusLine,
  TopBar,
  useToast,
} from "../components/ui";
import { challengeUrl, decodeChallenge, type Challenge } from "../lib/challenge";
import { emojiGrid, isSolved, keyStates, makeGuess, type Guess } from "../lib/evaluate";
import { BACK, ENTER, keyFromEvent } from "../lib/keys";
import { persisted } from "../lib/persist";
import { DEFAULT_NAMES, NAME_MAX, cleanName, playerNames } from "../lib/players";
import { plural } from "../lib/plural";
import { isRecord, isStrings } from "../lib/sanitize";
import { copyText, shareOrCopy, type ShareOutcome } from "../lib/share";
import { useKeys } from "../lib/useKeys";
import { LANGS, MAX_GUESSES, WORD_LENGTH, loadDict, type Lang } from "../lib/words";

const TITLE = "Вызов по ссылке";
const TRIES: [string, string, string] = ["попытку", "попытки", "попыток"];
const REVEAL_MS = 5 * 180 + 500;

/** Guesses made on each challenge link, so reopening it doesn't reset the game. */
const progress = persisted<Record<string, string[]>>("games:challenges", {}, (raw) =>
  isRecord(raw)
    ? Object.fromEntries(Object.entries(raw).filter((e): e is [string, string[]] => isStrings(e[1])))
    : null,
);
const KEEP_CHALLENGES = 40;

function saveProgress(code: string, words: string[]) {
  progress.set((prev) => {
    const next = { ...prev };
    delete next[code];
    next[code] = words;
    const keys = Object.keys(next);
    keys.slice(0, Math.max(0, keys.length - KEEP_CHALLENGES)).forEach((k) => delete next[k]);
    return next;
  });
}

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

interface Reply {
  to: string;
  lang: Lang;
  /** Guesses the replier needed for the word they were sent (0 = not found). */
  prev: number;
}

const SHARE_NOTE: Record<ShareOutcome, string | null> = {
  shared: null,
  cancelled: null,
  copied: "Скопировано — вставь в любой мессенджер",
  failed: "Не получилось скопировать — выдели ссылку вручную",
};

export default function ChallengeGame() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash.replace(/^#/, ""), () => "");
  const hydrated = useSyncExternalStore(
    subscribeHash,
    () => true,
    () => false,
  );
  const challenge = useMemo(() => (hash ? decodeChallenge(hash) : null), [hash]);
  const [reply, setReply] = useState<Reply | null>(null);

  const rules = (
    <RulesButton title={TITLE}>
      <p>Загадай слово из {WORD_LENGTH} букв — оно спрячется прямо в ссылке. Отправь её другу в любом мессенджере.</p>
      <p>Друг угадывает слово у себя ({MAX_GUESSES} попыток), а потом может загадать слово в ответ — к ответной ссылке приложится его результат.</p>
      <p>Так и играйте по очереди: каждый видит, за сколько попыток справился соперник, и пытается побить это.</p>
      <p className="text-wg-muted">Регистрация не нужна, сервер слова не хранит.</p>
    </RulesButton>
  );

  let body;
  if (!hydrated) body = null;
  else if (reply || !hash) body = <Create key={reply ? "reply" : "new"} reply={reply} />;
  else if (!challenge) body = <Broken />;
  else
    body = (
      <PlayChallenge
        key={hash}
        code={hash}
        challenge={challenge}
        onReply={(prev) => setReply({ to: challenge.from, lang: challenge.lang, prev })}
      />
    );

  return (
    <GameScreen>
      <TopBar title={TITLE} right={rules} />
      {body}
    </GameScreen>
  );
}

function Broken() {
  return (
    <Page>
      <h2 className="font-wg-display text-2xl font-extrabold">Ссылка сломалась</h2>
      <p className="text-[15px] leading-relaxed text-wg-muted">
        Похоже, ссылку скопировали не целиком. Попроси прислать её ещё раз — или загадай своё слово.
      </p>
      <Button onClick={() => (window.location.hash = "")}>Загадать слово</Button>
    </Page>
  );
}

function Create({ reply }: { reply: Reply | null }) {
  const names = playerNames.use();
  const [lang, setLang] = useState<Lang>(reply?.lang ?? "ru");
  const [step, setStep] = useState<"form" | "secret" | "done">("form");
  const [link, setLink] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const me = cleanName(names[0], DEFAULT_NAMES[0]);

  if (step === "secret") {
    return (
      <SecretEntry
        kind={{ type: "word", lang }}
        seat={0}
        title="Загадай слово"
        submitLabel="Создать ссылку"
        onSubmit={(word) => {
          playerNames.set([me, names[1]]);
          setLink(challengeUrl(window.location.origin, { lang, word, from: me, prev: reply?.prev }));
          setNote(null);
          setStep("done");
        }}
      >
        Угадывать его будет {reply ? <b className="text-wg-text">{reply.to}</b> : "твой друг"}.
      </SecretEntry>
    );
  }

  if (step === "done") {
    const invite =
      reply === null
        ? `${me} загадывает тебе слово из ${WORD_LENGTH} букв. Угадаешь?`
        : reply.prev > 0
          ? `${me}: твоё слово — за ${reply.prev} из ${MAX_GUESSES}. Теперь моё — угадаешь быстрее?`
          : `${me}: твоё слово мне не далось. Теперь моё — посмотрим, как справишься ты!`;
    const share = async () => setNote(SHARE_NOTE[await shareOrCopy({ title: TITLE, text: invite, url: link })]);
    const copy = async () => setNote(SHARE_NOTE[await copyText(link)]);

    return (
      <Page>
        <div>
          <h2 className="font-wg-display text-2xl font-extrabold">Ссылка готова</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-wg-muted">
            Отправь её {reply ? "в ответ" : "другу"} — слово спрятано в самой ссылке и откроется только в игре.
          </p>
        </div>
        <p className="wg-card select-all break-all px-4 py-3 font-mono text-[13px] leading-relaxed text-wg-muted">{link}</p>
        <div className="grid gap-2">
          <Button onClick={share}>
            <ShareIcon />
            Поделиться
          </Button>
          <Button variant="secondary" onClick={copy}>
            Скопировать ссылку
          </Button>
          {note && (
            <p role="status" className="text-center text-sm text-wg-muted">
              {note}
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={() => setStep("secret")}>
          Загадать другое слово
        </Button>
      </Page>
    );
  }

  return (
    <Page>
      <div>
        <h2 className="font-wg-display text-2xl font-extrabold">{reply ? "Ответный ход" : "Сыграть на расстоянии"}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-wg-muted">
          {reply
            ? "Загадай слово в ответ — к ссылке приложится твой результат, чтобы соперник знал, что нужно побить."
            : "Загадай слово, отправь ссылку — друг угадывает у себя, а потом загадывает слово тебе."}
        </p>
      </div>
      {reply && (
        <div className="wg-p1 rounded-xl bg-wg-surface-2 px-4 py-3 text-[15px]">
          <span className="text-wg-muted">Соперник: </span>
          <b className="text-wg-pc">{reply.to}</b>
          <span className="text-wg-muted"> · твой результат: </span>
          <b>{reply.prev > 0 ? `${reply.prev} из ${MAX_GUESSES}` : "не угадано"}</b>
        </div>
      )}
      <label className="wg-p0 block">
        <span className="mb-2 block text-[13px] font-semibold text-wg-muted">Твоё имя</span>
        <input
          value={names[0]}
          maxLength={NAME_MAX}
          onChange={(e) => playerNames.set([e.target.value, names[1]])}
          placeholder={DEFAULT_NAMES[0]}
          className="h-12 w-full rounded-xl border border-wg-line bg-wg-surface px-4 text-[15px] font-semibold outline-none transition focus:border-wg-pc"
        />
      </label>
      <Segmented label="Язык слова" value={lang} options={LANGS.map((l) => ({ value: l.id, label: l.label }))} onChange={setLang} />
      <Button onClick={() => setStep("secret")}>Загадать слово</Button>
      {!reply && (
        <p className="text-center text-sm text-wg-muted">
          Сидите рядом?{" "}
          <Link href="/games/duel" className="font-semibold text-wg-text underline underline-offset-4">
            Сыграйте дуэль на одном телефоне
          </Link>
        </p>
      )}
    </Page>
  );
}

function PlayChallenge({
  code,
  challenge: c,
  onReply,
}: {
  code: string;
  challenge: Challenge;
  onReply: (prev: number) => void;
}) {
  const saved = progress.use();
  const words = useMemo(() => saved[code] ?? [], [saved, code]);
  const guesses = useMemo(() => words.map((w) => makeGuess(w, c.word)), [words, c.word]);
  const solved = isSolved(guesses.at(-1));
  const over = solved || guesses.length >= MAX_GUESSES;

  const [current, setCurrent] = useState("");
  const [shake, setShake] = useState(0);
  const [revealRow, setRevealRow] = useState<number | null>(null);
  const [resultClosed, setResultClosed] = useState(false);
  const [toast, showToast] = useToast();
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    loadDict(c.lang).catch(() => {});
  }, [c.lang]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const finished = over && revealRow === null;

  const reject = (message: string) => {
    showToast(message);
    setShake((n) => n + 1);
  };

  const submit = async () => {
    if (busy.current || revealRow !== null || over) return;
    if (current.length < WORD_LENGTH) return reject("Мало букв");
    busy.current = true;
    try {
      const dict = await loadDict(c.lang);
      if (!dict.allowed.has(current) && current !== c.word) return reject("Такого слова нет в словаре");
      setRevealRow(words.length);
      setCurrent("");
      saveProgress(code, [...words, current]);
      timer.current = setTimeout(() => setRevealRow(null), REVEAL_MS);
    } catch {
      reject("Не получилось загрузить словарь");
    } finally {
      busy.current = false;
    }
  };

  const press = (key: string) => {
    if (revealRow !== null || over) return;
    if (key === ENTER) return void submit();
    if (key === BACK) setCurrent((v) => v.slice(0, -1));
    else setCurrent((v) => (v.length < WORD_LENGTH ? v + key : v));
  };

  useKeys(press, (e) => keyFromEvent(e, c.lang), !over);

  return (
    <PlayArea>
      <div className="shrink-0 px-4 pt-3 text-center">
        <p className="text-[15px]">
          <b className="wg-p1 text-wg-pc">{c.from}</b> загадывает тебе слово
        </p>
        {c.prev !== undefined && (
          <p className="mt-0.5 text-[13px] text-wg-muted">
            {c.prev > 0
              ? `Твоё слово — за ${c.prev} из ${MAX_GUESSES}. Сможешь быстрее?`
              : "Твоё слово так и не нашлось. Покажи, как надо!"}
          </p>
        )}
      </div>
      <div className="flex min-h-0 flex-1 px-4 pt-3">
        <div className="wg-fit">
          <Board
            guesses={guesses}
            active={!over}
            current={current}
            revealRow={revealRow ?? undefined}
            shake={shake}
            maxWidth={360}
            label="Твои попытки"
          />
        </div>
      </div>
      <StatusLine toast={toast}>
        {finished
          ? null
          : `Попытка ${Math.min(guesses.length + (revealRow === null ? 1 : 0), MAX_GUESSES)} из ${MAX_GUESSES}`}
      </StatusLine>
      <div className="shrink-0 pb-[max(8px,env(safe-area-inset-bottom))]">
        {finished ? (
          <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-3">
            <Button variant="secondary" onClick={() => setResultClosed(false)}>
              Итоги
            </Button>
            <Button onClick={() => onReply(solved ? guesses.length : 0)}>Ответить</Button>
          </div>
        ) : (
          <div className="wg-p0">
            <Keyboard
              lang={c.lang}
              states={keyStates(revealRow !== null ? guesses.slice(0, revealRow) : guesses)}
              onKey={press}
            />
          </div>
        )}
      </div>
      <Sheet open={finished && !resultClosed} onClose={() => setResultClosed(true)}>
        <ChallengeResult challenge={c} guesses={guesses} solved={solved} onReply={onReply} />
      </Sheet>
    </PlayArea>
  );
}

function ChallengeResult({
  challenge: c,
  guesses,
  solved,
  onReply,
}: {
  challenge: Challenge;
  guesses: Guess[];
  solved: boolean;
  onReply: (prev: number) => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const tries = guesses.length;
  const mine = solved ? tries : 0;

  // 0 means "not found", which loses to any number of guesses.
  const rank = (n: number) => (n > 0 ? n : MAX_GUESSES + 1);
  const verdict =
    c.prev === undefined
      ? null
      : rank(mine) < rank(c.prev)
        ? "Ты быстрее!"
        : rank(mine) > rank(c.prev)
          ? `${c.from} пока впереди`
          : "Ничья";

  const shareResult = async () => {
    const text = `Твоё слово, ${c.from}: ${solved ? tries : "X"}/${MAX_GUESSES}\n${emojiGrid(guesses)}`;
    setNote(SHARE_NOTE[await shareOrCopy({ title: TITLE, text })]);
  };

  return (
    <div className="text-center">
      <p className="font-wg-display text-3xl font-extrabold">{solved ? "Угадано!" : "Не в этот раз"}</p>
      <p className="mt-1 text-wg-muted">
        {solved ? `За ${tries} ${plural(tries, TRIES)}` : `За ${MAX_GUESSES} попыток слово не нашлось`}
      </p>
      <div className="mx-auto mt-4 flex max-w-[260px] justify-center gap-1.5" aria-label={`Слово: ${c.word}`}>
        {Array.from(c.word).map((ch, i) => (
          <span
            key={i}
            className="grid aspect-square flex-1 place-items-center rounded-md bg-wg-correct font-extrabold uppercase text-white"
          >
            {ch}
          </span>
        ))}
      </div>
      {verdict && c.prev !== undefined && (
        <div className="mt-5 rounded-xl bg-wg-surface-2 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="wg-p0">
              <p className="text-[13px] font-semibold text-wg-pc">Ты</p>
              <p className="font-wg-display text-xl font-extrabold">{mine || "✗"}</p>
            </div>
            <div className="wg-p1">
              <p className="truncate text-[13px] font-semibold text-wg-pc">{c.from}</p>
              <p className="font-wg-display text-xl font-extrabold">{c.prev || "✗"}</p>
            </div>
          </div>
          <p className="mt-2 font-semibold">{verdict}</p>
        </div>
      )}
      <div className="mt-5 grid gap-2">
        <Button onClick={() => onReply(mine)}>Загадать слово в ответ</Button>
        <Button variant="secondary" onClick={shareResult}>
          <ShareIcon />
          Отправить результат
        </Button>
        {note && (
          <p role="status" className="text-sm text-wg-muted">
            {note}
          </p>
        )}
        <Link href="/games" className="mt-1 text-sm font-semibold text-wg-muted underline-offset-4 hover:underline">
          Все игры
        </Link>
      </div>
    </div>
  );
}
