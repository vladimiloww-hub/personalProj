"use client";

import Link from "next/link";
import { CATEGORIES, EXAM_FORMATS, OFFICIAL_BANK_SIZE, OFFICIAL_LINKS } from "../data/meta";
import { IS_DEMO_BANK } from "../data/questions";
import { QUESTIONS } from "../lib/bank";
import { tr } from "../lib/i18n";
import { useStore } from "../lib/store";
import { Icon } from "../components/Icon";
import { PageTitle, btn } from "../components/ui";

const STEPS = [
  {
    title: "Медицинская справка",
    text: "Пройдите медицинскую комиссию для водителей нужной категории — справка понадобится для обучения и экзамена.",
  },
  {
    title: "Обучение в автошколе",
    text: "Теоретический и практический курс в аккредитованном учебном заведении. Автошколы готовят по тем же вопросам, что и на экзамене ASP.",
  },
  {
    title: "Запись на экзамен",
    text: "Запишитесь онлайн на сайте ASP (раздел «Programare la examen») или в подразделении ASP, выбрав дату и место.",
  },
  {
    title: "Теоретическая часть",
    text: "Тест на компьютере в экзаменационном классе: вы выбираете ответы на мониторе на своём месте. Количество вопросов и время зависят от категории.",
  },
  {
    title: "Практическая часть",
    text: "После успешной теории — экзамен по вождению. Сдайте его, пока результат теории действителен.",
  },
  {
    title: "Водительское удостоверение",
    text: "После сдачи обоих этапов ASP оформляет национальное водительское удостоверение.",
  },
];

const TIPS = [
  "Сначала пройдите все вопросы в режиме «Новые», затем регулярно делайте «Работу над ошибками» — пока список ошибок не опустеет.",
  "Отмечайте ★ вопросы, в которых сомневаетесь, и собирайте свои списки по темам: «Знаки приоритета», «Остановка и стоянка» и т. п.",
  "Пишите заметки к сложным вопросам — они находятся поиском, так что свою подсказку легко найти.",
  "За несколько дней до экзамена решайте пробные экзамены в строгом режиме, пока не будете стабильно укладываться в допустимые ошибки.",
  "Тренируйтесь на том языке, на котором будете сдавать: переключатель RU/RO меняет текст вопросов.",
  "На экзамене не торопитесь: на один вопрос приходится больше минуты. Читайте вопрос до конца — часто решает одно слово («разрешено», «запрещено», «обязан»).",
];

export default function Info() {
  const { settings } = useStore();
  const short = EXAM_FORMATS.short;
  const long = EXAM_FORMATS.long;
  const cats = (f: "short" | "long") => CATEGORIES.filter((c) => c.format === f);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageTitle title="Как проходит экзамен" subtitle="Официальный формат теоретического экзамена ASP (Agenția Servicii Publice), порядок получения прав и полезные ссылки." />

      <section className="grid gap-3 sm:grid-cols-2">
        {[
          { f: short, list: cats("short"), label: "Категории A, B, H и подкатегории AM, A1, A2, B1" },
          { f: long, list: cats("long"), label: "Категории BE, C, CE, D, F и подкатегории C1, C1E, D1, D1E" },
        ].map(({ f, list, label }) => (
          <div key={label} className="mr-card p-5">
            <p className="text-sm text-mr-muted">{label}</p>
            <div className="mt-3 flex items-end gap-5">
              <div>
                <div className="text-4xl font-bold">{f.questions}</div>
                <div className="text-xs text-mr-muted">вопросов</div>
              </div>
              <div>
                <div className="text-4xl font-bold">{f.minutes}</div>
                <div className="text-xs text-mr-muted">минут</div>
              </div>
              <div>
                <div className="text-4xl font-bold">≥ {f.minCorrect}</div>
                <div className="text-xs text-mr-muted">верных</div>
              </div>
            </div>
            <p className="mt-3 text-sm">
              Допускается не более <b>{f.questions - f.minCorrect}</b> ошибок. Результат — «Admis» (сдан) или «Respins» (не сдан).
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {list.map((c) => (
                <span key={c.code} className="rounded-md bg-mr-surface-2 px-2 py-0.5 text-xs font-semibold" title={c.name.ru}>
                  {c.code}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mr-card p-5">
        <h2 className="mb-2 font-semibold">База вопросов</h2>
        <p className="text-[15px] leading-relaxed">
          ASP использует официальный сборник вопросов для теоретического экзамена; по нему же готовят автошколы. В июне 2024 года
          сборник дополнили: было 940 вопросов, стало <b>{OFFICIAL_BANK_SIZE}</b>. Число вопросов в самом тесте не изменилось.
          Сдавать можно на румынском или русском языке.
        </p>
        <p className="mt-3 text-sm text-mr-muted">
          {IS_DEMO_BANK
            ? `На этом сайте сейчас временный набор из ${QUESTIONS.length} вопросов, составленных по общим нормам РЦР. Официальная база будет подключена вместо него.`
            : `На этом сайте загружено ${QUESTIONS.length} вопросов.`}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Путь к водительскому удостоверению</h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="mr-card flex gap-3 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mr-accent text-sm font-bold text-mr-accent-ink">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{s.title}</span>
                <span className="mt-0.5 block text-sm text-mr-muted">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-mr-muted">
          По сообщениям СМИ, результат теоретического экзамена действует 12 месяцев: если за это время не сдать практику, теорию
          придётся пересдать. Сроки, стоимость и перечень документов уточняйте на asp.gov.md — они могут меняться.
        </p>
      </section>

      <section className="mr-card p-5">
        <h2 className="mb-3 font-semibold">Категории</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-mr-line text-left text-xs text-mr-muted">
                <th className="py-2 font-medium">Код</th>
                <th className="py-2 font-medium">Транспорт</th>
                <th className="py-2 text-right font-medium">Тест</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => {
                const f = EXAM_FORMATS[c.format];
                return (
                  <tr key={c.code} className="border-b border-mr-line/60">
                    <td className="py-2 font-semibold">{c.code}</td>
                    <td className="py-2">{tr(c.name, settings.lang)}</td>
                    <td className="py-2 text-right tabular-nums text-mr-muted">
                      {f.questions} / {f.minutes} мин / ≥{f.minCorrect}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mr-card p-5">
        <h2 className="mb-3 font-semibold">Важные цифры</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["50 км/ч", "в населённых пунктах, если знаками не установлено иное"],
            ["90 км/ч", "вне населённых пунктов для легковых (до 3,5 т); на дорогах со знаком «Автомагистраль» — до 110 км/ч"],
            ["0,3 г/л · 0,15 мг/л", "допустимый предел алкоголя в крови и в выдыхаемом воздухе (с 7 сентября 2024 г.)"],
            ["112", "единый номер экстренных служб"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-mr-surface-2 p-3">
              <dt className="text-lg font-bold">{k}</dt>
              <dd className="text-sm text-mr-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Советы по подготовке</h2>
        <ul className="mr-card divide-y divide-mr-line">
          {TIPS.map((t) => (
            <li key={t} className="flex gap-3 px-4 py-3 text-[15px]">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-mr-good" />
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/mreomd/exam" className={btn.primary}>
            Пройти пробный экзамен
          </Link>
          <Link href="/mreomd/practice" className={btn.secondary}>
            Тренировка
          </Link>
        </div>
      </section>

      <section className="mr-card p-5">
        <h2 className="mb-3 font-semibold">Официальные источники</h2>
        <ul className="space-y-1">
          {OFFICIAL_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-[15px] text-mr-accent hover:bg-mr-surface-2"
              >
                <Icon name="external" size={16} className="shrink-0" />
                {tr(l.title, settings.lang)}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-mr-muted">
          Сайт не является официальным ресурсом ASP. Прогресс, списки и заметки хранятся только в вашем браузере.
        </p>
      </section>
    </div>
  );
}
