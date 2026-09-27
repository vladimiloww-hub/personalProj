import type { Category, CategoryCode, ExamFormat, Topic, TopicId } from "../lib/types";

/**
 * Official ASP theoretical exam formats
 * (asp.gov.md → Servicii → Conducători auto → Examinarea la proba teoretică).
 */
export const EXAM_FORMATS: Record<Category["format"], ExamFormat> = {
  short: { questions: 24, minutes: 30, minCorrect: 22 },
  long: { questions: 30, minutes: 38, minCorrect: 27 },
};

export const CATEGORIES: Category[] = [
  { code: "AM", format: "short", groups: ["moto"], name: { ru: "Мопеды, лёгкие квадрициклы", ro: "Mopede, cvadricicluri ușoare" } },
  { code: "A1", format: "short", groups: ["moto"], name: { ru: "Лёгкие мотоциклы до 125 см³", ro: "Motociclete ușoare până la 125 cm³" } },
  { code: "A2", format: "short", groups: ["moto"], name: { ru: "Мотоциклы до 35 кВт", ro: "Motociclete până la 35 kW" } },
  { code: "A", format: "short", groups: ["moto"], name: { ru: "Мотоциклы", ro: "Motociclete" } },
  { code: "B1", format: "short", groups: ["car"], name: { ru: "Квадрициклы, мототрициклы", ro: "Cvadricicluri, triciclete" } },
  { code: "B", format: "short", groups: ["car"], name: { ru: "Легковые автомобили до 3,5 т", ro: "Autoturisme până la 3,5 t" } },
  { code: "H", format: "short", groups: ["car", "tractor"], name: { ru: "Тракторы и самоходные машины", ro: "Tractoare și mașini autopropulsate" } },
  { code: "BE", format: "long", groups: ["car", "trailer"], name: { ru: "B с тяжёлым прицепом", ro: "B cu remorcă grea" } },
  { code: "C1", format: "long", groups: ["car", "truck"], name: { ru: "Грузовые 3,5–7,5 т", ro: "Autocamioane 3,5–7,5 t" } },
  { code: "C1E", format: "long", groups: ["car", "truck", "trailer"], name: { ru: "C1 с прицепом", ro: "C1 cu remorcă" } },
  { code: "C", format: "long", groups: ["car", "truck"], name: { ru: "Грузовые автомобили", ro: "Autocamioane" } },
  { code: "CE", format: "long", groups: ["car", "truck", "trailer"], name: { ru: "C с прицепом", ro: "C cu remorcă" } },
  { code: "D1", format: "long", groups: ["car", "bus"], name: { ru: "Автобусы до 16 мест", ro: "Autobuze până la 16 locuri" } },
  { code: "D1E", format: "long", groups: ["car", "bus", "trailer"], name: { ru: "D1 с прицепом", ro: "D1 cu remorcă" } },
  { code: "D", format: "long", groups: ["car", "bus"], name: { ru: "Автобусы", ro: "Autobuze" } },
  { code: "F", format: "long", groups: ["bus", "trolley"], name: { ru: "Троллейбусы", ro: "Troleibuze" } },
];

export const CATEGORY_BY_CODE = Object.fromEntries(
  CATEGORIES.map((c) => [c.code, c]),
) as Record<CategoryCode, Category>;

export function examFormatFor(code: CategoryCode): ExamFormat {
  return EXAM_FORMATS[CATEGORY_BY_CODE[code].format];
}

export const TOPICS: Topic[] = [
  { id: "general", icon: "📘", name: { ru: "Общие положения и термины", ro: "Dispoziții generale și noțiuni" } },
  { id: "drivers", icon: "🧑‍✈️", name: { ru: "Обязанности водителей", ro: "Obligațiile conducătorilor" } },
  { id: "signals", icon: "🚦", name: { ru: "Светофоры и регулировщик", ro: "Semafoare și agentul de circulație" } },
  { id: "signs", icon: "⚠️", name: { ru: "Дорожные знаки", ro: "Indicatoare rutiere" } },
  { id: "markings", icon: "〰️", name: { ru: "Дорожная разметка", ro: "Marcaje rutiere" } },
  { id: "priority-vehicles", icon: "🚨", name: { ru: "Спецсигналы и спецтранспорт", ro: "Vehicule cu regim prioritar" } },
  { id: "maneuvers", icon: "↪️", name: { ru: "Манёвры и расположение", ro: "Manevre și poziția pe carosabil" } },
  { id: "speed", icon: "⏱️", name: { ru: "Скорость и дистанция", ro: "Viteza și distanța" } },
  { id: "overtaking", icon: "⏩", name: { ru: "Обгон и встречный разъезд", ro: "Depășirea și trecerea pe lângă" } },
  { id: "stopping", icon: "🅿️", name: { ru: "Остановка и стоянка", ro: "Oprirea și staționarea" } },
  { id: "intersections", icon: "✚", name: { ru: "Проезд перекрёстков", ro: "Trecerea intersecțiilor" } },
  { id: "pedestrians", icon: "🚶", name: { ru: "Пешеходы и остановки", ro: "Pietoni și stații" } },
  { id: "railway", icon: "🚆", name: { ru: "Железнодорожные переезды", ro: "Treceri la nivel cu calea ferată" } },
  { id: "motorway", icon: "🛣️", name: { ru: "Автомагистрали и жилые зоны", ro: "Autostrăzi și zone rezidențiale" } },
  { id: "lights", icon: "💡", name: { ru: "Световые приборы и сигналы", ro: "Iluminarea și semnalele sonore" } },
  { id: "towing", icon: "🪝", name: { ru: "Буксировка", ro: "Remorcarea" } },
  { id: "transport", icon: "📦", name: { ru: "Перевозка людей и грузов", ro: "Transportul persoanelor și mărfurilor" } },
  { id: "technical", icon: "🔧", name: { ru: "Техническое состояние", ro: "Starea tehnică a vehiculului" } },
  { id: "safety", icon: "🛡️", name: { ru: "Безопасность и техника вождения", ro: "Siguranța și tehnica conducerii" } },
  { id: "firstaid", icon: "⛑️", name: { ru: "Первая помощь", ro: "Primul ajutor" } },
  { id: "law", icon: "⚖️", name: { ru: "Документы и ответственность", ro: "Documente și răspundere" } },
];

export const TOPIC_BY_ID: Record<TopicId, Topic | undefined> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t]),
);

/** Size of the official ASP question bank after the June 2024 update. */
export const OFFICIAL_BANK_SIZE = 1258;

export const OFFICIAL_LINKS = [
  {
    href: "https://www.asp.gov.md/ro/servicii/conducatori-auto/31/311-1",
    title: { ru: "ASP: экзамен — теоретическая часть", ro: "ASP: examinarea la proba teoretică" },
  },
  {
    href: "https://www.asp.gov.md/ro/servicii/conducatori-auto/31/311-2",
    title: { ru: "ASP: экзамен — практическая часть", ro: "ASP: examinarea la proba practică" },
  },
  {
    href: "https://www.asp.gov.md/ro/programare/examen",
    title: { ru: "ASP: онлайн-запись на экзамен", ro: "ASP: programare online la examen" },
  },
  {
    href: "https://www.asp.gov.md/ro/media/2024-06-03",
    title: {
      ru: "ASP: новые вопросы в тестах (июнь 2024)",
      ro: "ASP: noi întrebări în teste (iunie 2024)",
    },
  },
  {
    href: "https://www.legis.md/cautare/getResults?doc_id=124130&lang=ro",
    title: {
      ru: "Правила дорожного движения (ПП № 357/2009)",
      ro: "Regulamentul circulației rutiere (HG nr. 357/2009)",
    },
  },
  {
    href: "https://www.legis.md/cautare/getResults?lang=ro&doc_id=98583",
    title: {
      ru: "Закон № 131/2007 о безопасности дорожного движения",
      ro: "Legea nr. 131/2007 privind siguranța traficului rutier",
    },
  },
  {
    href: "https://servicii.gov.md/ru/service/008000370",
    title: {
      ru: "Портал госуслуг: экзамен на водительские права",
      ro: "Portalul serviciilor publice: examen permis de conducere",
    },
  },
] as const;
