import type { Metadata } from "next";
import Link from "next/link";
import type { Mark } from "./lib/evaluate";
import { ArrowRightIcon } from "./components/icons";

export const metadata: Metadata = {
  title: { absolute: "Игры для двоих — словесные дуэли" },
};

const TILE: Record<Mark, string> = {
  correct: "bg-wg-correct border-wg-correct text-white",
  present: "bg-wg-present border-wg-present text-white",
  absent: "bg-wg-absent border-wg-absent text-white",
};

function Tiles({ word, marks, size = "sm" }: { word: string; marks: (Mark | null)[]; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "size-[clamp(40px,12vw,58px)] text-[clamp(20px,6vw,30px)]" : "size-7 text-[13px]";
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from(word).map((ch, i) => {
        const mark = marks[i];
        return (
          <span
            key={i}
            className={`grid place-items-center rounded-md border-2 font-extrabold uppercase ${box} ${
              mark ? TILE[mark] : "border-wg-line text-wg-text"
            }`}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}

const GAMES = [
  {
    href: "/games/duel",
    title: "Вордл-дуэль",
    text: "Загадайте друг другу по слову и ищите их наперегонки. Кто угадает за меньшее число попыток — тот и победил.",
    tags: ["один телефон", "слова"],
    preview: (
      <div className="space-y-1">
        <div className="wg-p0 flex items-center gap-2">
          <span className="size-2 rounded-full bg-wg-pc" />
          <Tiles word="весна" marks={["correct", "absent", "present", "absent", "correct"]} />
        </div>
        <div className="wg-p1 flex items-center gap-2">
          <span className="size-2 rounded-full bg-wg-pc" />
          <Tiles word="полка" marks={["absent", "correct", "correct", "present", "absent"]} />
        </div>
      </div>
    ),
  },
  {
    href: "/games/lingo",
    title: "Общая доска",
    text: "Одно слово, одна доска, ходы по очереди. Чужие подсказки помогают и тебе — кто первым назовёт слово, забирает раунд.",
    tags: ["один телефон", "раунды"],
    preview: (
      <div className="space-y-1">
        <div className="wg-p0 flex items-center gap-2">
          <span className="size-2 rounded-full bg-wg-pc" />
          <Tiles word="кошка" marks={["correct", "absent", "absent", "present", "correct"]} />
        </div>
        <div className="wg-p1 flex items-center gap-2">
          <span className="size-2 rounded-full bg-wg-pc" />
          <Tiles word="книга" marks={["correct", "correct", "correct", "correct", "correct"]} />
        </div>
      </div>
    ),
  },
  {
    href: "/games/challenge",
    title: "Вызов по ссылке",
    text: "Загадай слово и отправь ссылку. Друг угадывает у себя, а потом загадывает слово тебе — и видно, кто быстрее.",
    tags: ["на расстоянии", "без регистрации"],
    preview: (
      <div className="flex items-center gap-2">
        <Tiles word="ветер" marks={[null, null, null, null, null]} />
        <span className="grid size-7 place-items-center rounded-md bg-wg-text text-wg-bg">
          <ArrowRightIcon />
        </span>
      </div>
    ),
  },
  {
    href: "/games/bulls",
    title: "Быки и коровы",
    text: "Классика, из которой вырос Вордл: загадайте числа из разных цифр. Подсказки — только «быки» и «коровы».",
    tags: ["один телефон", "цифры"],
    preview: (
      <div className="flex items-center gap-2 font-mono">
        <span className="text-lg font-bold tracking-[0.15em]">4271</span>
        <span className="rounded-md bg-wg-correct px-1.5 py-0.5 text-[12px] font-bold text-white">2Б</span>
        <span className="rounded-md bg-wg-present px-1.5 py-0.5 text-[12px] font-bold text-white">1К</span>
      </div>
    ),
  },
];

export default function GamesHub() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-16">
      <header className="flex flex-col items-center text-center">
        <Tiles word="двое" marks={["correct", "present", "correct", "absent"]} size="lg" />
        <h1 className="mt-5 font-wg-display text-[clamp(28px,7vw,44px)] font-extrabold leading-tight">Игры для двоих</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-wg-muted">
          Вордл и его родня — играйте вдвоём на одном телефоне или вызовите друга по ссылке.
        </p>
      </header>

      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        {GAMES.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="wg-card group flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-wg-muted"
          >
            <div className="flex min-h-14 items-center">{g.preview}</div>
            <div>
              <h2 className="flex items-center justify-between gap-2 font-wg-display text-lg font-extrabold">
                {g.title}
                <span className="text-wg-muted transition group-hover:translate-x-0.5 group-hover:text-wg-text">
                  <ArrowRightIcon />
                </span>
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-wg-muted">{g.text}</p>
            </div>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {g.tags.map((t) => (
                <span key={t} className="rounded-full bg-wg-surface-2 px-2.5 py-1 text-[12px] font-semibold text-wg-muted">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-wg-display text-base font-extrabold">Рядом, на одном телефоне</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-wg-muted">
            Ходите по очереди и передавайте телефон. Секретные слова вводятся скрытыми, а перед вводом второго слова
            игра попросит передать устройство — подглядеть не выйдет. Партия сохраняется, даже если закрыть вкладку.
          </p>
        </div>
        <div>
          <h2 className="font-wg-display text-base font-extrabold">На расстоянии, по ссылке</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-wg-muted">
            Слово прячется прямо в ссылке — без регистрации и серверов. Друг угадывает у себя и отвечает своим словом, а
            к ответу прикладывается его результат: видно, кому нужно меньше попыток.
          </p>
        </div>
      </section>
    </main>
  );
}
