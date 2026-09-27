import type { ReactNode } from "react";
import type { L } from "../lib/types";

/*
 * Road signs drawn as inline SVG (viewBox 0 0 100 100) so they stay crisp,
 * work offline and need no image assets. Shapes and colours follow the
 * Vienna Convention layout used by the Moldovan RCR (annex 1).
 */

const RED = "#d52b1e";
const BLUE = "#1c5bb8";
const YELLOW = "#f7c600";
const INK = "#1a1a1a";
const WHITE = "#ffffff";
const GREY = "#9aa0a6";

export type SignGroup =
  | "warning"
  | "priority"
  | "prohibitory"
  | "mandatory"
  | "info"
  | "service";

export interface SignDef {
  id: string;
  group: SignGroup;
  name: L;
  desc: L;
  art: () => ReactNode;
}

export const SIGN_GROUPS: { id: SignGroup; name: L; hint: L }[] = [
  {
    id: "warning",
    name: { ru: "Предупреждающие", ro: "De avertizare" },
    hint: {
      ru: "Треугольник с красной каймой — предупреждают об опасном участке.",
      ro: "Triunghi cu chenar roșu — avertizează asupra unui sector periculos.",
    },
  },
  {
    id: "priority",
    name: { ru: "Приоритета", ro: "De prioritate" },
    hint: {
      ru: "Устанавливают очерёдность проезда перекрёстков и узких участков.",
      ro: "Stabilesc ordinea de trecere prin intersecții și sectoare înguste.",
    },
  },
  {
    id: "prohibitory",
    name: { ru: "Запрещающие", ro: "De interzicere" },
    hint: {
      ru: "Круг с красной каймой — вводят или отменяют ограничения.",
      ro: "Cerc cu chenar roșu — introduc sau anulează restricții.",
    },
  },
  {
    id: "mandatory",
    name: { ru: "Предписывающие", ro: "De obligare" },
    hint: {
      ru: "Синий круг — обязывают двигаться определённым образом.",
      ro: "Cerc albastru — obligă la un anumit mod de deplasare.",
    },
  },
  {
    id: "info",
    name: { ru: "Информационно-указательные", ro: "De informare și orientare" },
    hint: {
      ru: "Вводят или отменяют режим движения, информируют о населённых пунктах и объектах.",
      ro: "Introduc sau anulează un regim de circulație, informează despre localități și obiective.",
    },
  },
  {
    id: "service",
    name: { ru: "Сервиса", ro: "De servicii" },
    hint: {
      ru: "Информируют о расположении объектов обслуживания.",
      ro: "Informează despre amplasarea obiectivelor de deservire.",
    },
  },
];

// ——— frames ———

function Warn({ children }: { children?: ReactNode }) {
  return (
    <>
      <polygon
        points="50,9 93,85 7,85"
        fill={WHITE}
        stroke={RED}
        strokeWidth={9}
        strokeLinejoin="round"
      />
      {children}
    </>
  );
}

function Ring({ children, fill = WHITE }: { children?: ReactNode; fill?: string }) {
  return (
    <>
      <circle cx={50} cy={50} r={42} fill={fill} stroke={RED} strokeWidth={11} />
      {children}
    </>
  );
}

function EndRing({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx={50} cy={50} r={45} fill={WHITE} stroke={GREY} strokeWidth={2} />
      {children}
      <g stroke={INK} strokeWidth={2.2}>
        {[-12, -6, 0, 6, 12].map((o) => (
          <line key={o} x1={20 + o} y1={80 + o} x2={80 + o} y2={20 + o} />
        ))}
      </g>
    </>
  );
}

function Blue({ children }: { children?: ReactNode }) {
  return (
    <>
      <circle cx={50} cy={50} r={46} fill={BLUE} stroke={WHITE} strokeWidth={2} />
      {children}
    </>
  );
}

function Square({ children, fill = BLUE }: { children?: ReactNode; fill?: string }) {
  return (
    <>
      <rect x={5} y={5} width={90} height={90} rx={9} fill={fill} />
      <rect x={9} y={9} width={82} height={82} rx={6} fill="none" stroke={WHITE} strokeWidth={2.5} />
      {children}
    </>
  );
}

function Slash({ color = RED }: { color?: string }) {
  return <line x1={22} y1={22} x2={78} y2={78} stroke={color} strokeWidth={8} />;
}

// ——— pictograms ———

function Arrow({ d, head, color = WHITE, w = 11 }: { d: string; head: string; color?: string; w?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinejoin="round" />
      <polygon points={head} fill={color} />
    </>
  );
}

function CarRear({ x, color }: { x: number; color: string }) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M-11 42 L-8 33 Q-7 31 -4 31 L4 31 Q7 31 8 33 L11 42 Z" />
      <rect x={-14} y={41} width={28} height={16} rx={3} />
      <rect x={-13} y={56} width={6} height={7} rx={1.5} />
      <rect x={7} y={56} width={6} height={7} rx={1.5} />
    </g>
  );
}

function CarSide({ color = INK, t = "" }: { color?: string; t?: string }) {
  return (
    <g fill={color} transform={t}>
      <path d="M22 60 L28 50 Q31 45 37 45 L58 45 Q63 45 67 50 L73 57 L79 59 Q81 60 81 63 L81 67 L20 67 L20 63 Q20 61 22 60 Z" />
      <circle cx={33} cy={68} r={6} />
      <circle cx={68} cy={68} r={6} />
    </g>
  );
}

function TruckSide({ color = INK }: { color?: string }) {
  return (
    <g fill={color}>
      <rect x={20} y={38} width={40} height={24} rx={1.5} />
      <path d="M62 44 L73 44 L80 53 L80 62 L62 62 Z" />
      <circle cx={31} cy={65} r={5.5} />
      <circle cx={70} cy={65} r={5.5} />
    </g>
  );
}

function Walker({ t = "", color = INK }: { t?: string; color?: string }) {
  return (
    <g transform={t} stroke={color} strokeWidth={5} strokeLinecap="round" fill="none">
      <circle cx={52} cy={30} r={5} fill={color} stroke="none" />
      <path d="M50 38 L46 56 L38 72" />
      <path d="M46 56 L55 64 L58 74" />
      <path d="M49 42 L40 50" />
      <path d="M49 42 L58 50" />
    </g>
  );
}

function Bicycle({ color = INK, t = "" }: { color?: string; t?: string }) {
  return (
    <g transform={t} stroke={color} strokeWidth={3.5} fill="none" strokeLinecap="round">
      <circle cx={32} cy={62} r={10} />
      <circle cx={68} cy={62} r={10} />
      <path d="M32 62 L44 44 L62 44 L68 62 M44 44 L52 62 L62 44 M40 40 L48 40 M60 44 L58 36 L64 36" />
    </g>
  );
}

function Locomotive() {
  return (
    <g fill={INK}>
      <rect x={30} y={50} width={30} height={16} />
      <rect x={56} y={40} width={16} height={26} />
      <rect x={34} y={42} width={6} height={8} />
      <rect x={26} y={62} width={50} height={5} />
      <circle cx={38} cy={71} r={5} />
      <circle cx={52} cy={71} r={5} />
      <circle cx={66} cy={71} r={5} />
    </g>
  );
}

function Tram({ color = INK }: { color?: string }) {
  return (
    <g fill={color}>
      <line x1={50} y1={28} x2={50} y2={38} stroke={color} strokeWidth={3} />
      <line x1={42} y1={28} x2={58} y2={28} stroke={color} strokeWidth={3} />
      <rect x={30} y={38} width={40} height={30} rx={5} />
      <rect x={34} y={42} width={14} height={11} fill={WHITE} />
      <rect x={52} y={42} width={14} height={11} fill={WHITE} />
      <rect x={34} y={70} width={8} height={4} />
      <rect x={58} y={70} width={8} height={4} />
    </g>
  );
}

function Bus({ color = INK }: { color?: string }) {
  return (
    <g fill={color}>
      <rect x={26} y={32} width={48} height={36} rx={6} />
      <rect x={31} y={37} width={38} height={15} fill={WHITE} />
      <circle cx={34} cy={60} r={3} fill={WHITE} />
      <circle cx={66} cy={60} r={3} fill={WHITE} />
      <rect x={30} y={68} width={8} height={6} rx={1} />
      <rect x={62} y={68} width={8} height={6} rx={1} />
    </g>
  );
}

function Num({ n, color = INK, size = 34, y = 62 }: { n: string; color?: string; size?: number; y?: number }) {
  return (
    <text
      x={50}
      y={y}
      textAnchor="middle"
      fontFamily="Arial, Helvetica, sans-serif"
      fontWeight={700}
      fontSize={size}
      fill={color}
    >
      {n}
    </text>
  );
}

function Zebra({ y = 70 }: { y?: number }) {
  return (
    <g fill={INK}>
      {[26, 36, 46, 56, 66].map((x) => (
        <rect key={x} x={x} y={y} width={6} height={6} />
      ))}
    </g>
  );
}

function Roundabout({ color }: { color: string }) {
  const one = (
    <>
      <path d="M50 26 A24 24 0 0 1 71 38" fill="none" stroke={color} strokeWidth={8} />
      <polygon points="78,30 78,48 62,42" fill={color} />
    </>
  );
  return (
    <g>
      {[0, 120, 240].map((r) => (
        <g key={r} transform={`rotate(${r} 50 50)`}>
          {one}
        </g>
      ))}
    </g>
  );
}

function Horn() {
  return <polygon points="24,44 38,44 64,28 64,72 38,56 24,56" fill={INK} />;
}

function LightsBox() {
  return (
    <g>
      <rect x={40} y={30} width={20} height={48} rx={4} fill={INK} />
      <circle cx={50} cy={39} r={5.5} fill={RED} />
      <circle cx={50} cy={54} r={5.5} fill={YELLOW} />
      <circle cx={50} cy={69} r={5.5} fill="#1fa84a" />
    </g>
  );
}

// ——— catalog ———

export const SIGNS: SignDef[] = [
  // Warning
  {
    id: "w-rail-barrier",
    group: "warning",
    name: { ru: "Железнодорожный переезд со шлагбаумом", ro: "Trecere la nivel cu calea ferată cu bariere" },
    desc: {
      ru: "Предупреждает о переезде, оборудованном шлагбаумом. Вне населённых пунктов обычно дублируется знаками с табличками-сигнальными столбиками.",
      ro: "Avertizează asupra unei treceri la nivel cu bariere. În afara localităților de regulă este însoțit de panouri suplimentare cu dungi.",
    },
    art: () => (
      <Warn>
        <g fill={INK}>
          <rect x={30} y={48} width={5} height={28} />
          <rect x={65} y={48} width={5} height={28} />
          <rect x={30} y={54} width={40} height={5} />
          <rect x={30} y={66} width={40} height={5} />
          {[40, 47, 54, 61].map((x) => (
            <rect key={x} x={x} y={50} width={3} height={25} />
          ))}
        </g>
      </Warn>
    ),
  },
  {
    id: "w-rail-nobarrier",
    group: "warning",
    name: { ru: "Железнодорожный переезд без шлагбаума", ro: "Trecere la nivel cu calea ferată fără bariere" },
    desc: {
      ru: "Предупреждает о переезде без шлагбаума. Перед таким переездом нужно быть особенно внимательным и убедиться в отсутствии поезда.",
      ro: "Avertizează asupra unei treceri la nivel fără bariere. Înainte de ea trebuie să vă convingeți că nu se apropie trenul.",
    },
    art: () => (
      <Warn>
        <Locomotive />
      </Warn>
    ),
  },
  {
    id: "w-equal-crossing",
    group: "warning",
    name: { ru: "Пересечение равнозначных дорог", ro: "Intersecție de drumuri egale" },
    desc: {
      ru: "Впереди перекрёсток равнозначных дорог: действует правило «помехи справа».",
      ro: "Urmează o intersecție de drumuri egale: se aplică regula priorității de dreapta.",
    },
    art: () => (
      <Warn>
        <g stroke={INK} strokeWidth={8}>
          <line x1={34} y1={42} x2={66} y2={76} />
          <line x1={66} y1={42} x2={34} y2={76} />
        </g>
      </Warn>
    ),
  },
  {
    id: "w-roundabout",
    group: "warning",
    name: { ru: "Пересечение с круговым движением", ro: "Intersecție cu sens giratoriu" },
    desc: {
      ru: "Предупреждает о перекрёстке с круговым движением.",
      ro: "Avertizează asupra unei intersecții cu circulație în sens giratoriu.",
    },
    art: () => (
      <Warn>
        <g transform="translate(15 22) scale(0.7)">
          <Roundabout color={INK} />
        </g>
      </Warn>
    ),
  },
  {
    id: "w-lights",
    group: "warning",
    name: { ru: "Светофорное регулирование", ro: "Semafoare" },
    desc: {
      ru: "Предупреждает о перекрёстке, пешеходном переходе или участке дороги, движение на котором регулируется светофором.",
      ro: "Avertizează asupra unei intersecții, treceri pentru pietoni sau sector de drum cu circulația dirijată prin semafoare.",
    },
    art: () => (
      <Warn>
        <LightsBox />
      </Warn>
    ),
  },
  {
    id: "w-curve-right",
    group: "warning",
    name: { ru: "Опасный поворот направо", ro: "Curbă periculoasă la dreapta" },
    desc: {
      ru: "Закругление дороги малого радиуса или с ограниченной видимостью. Снизьте скорость заранее.",
      ro: "Curbă cu rază mică sau vizibilitate redusă. Reduceți viteza din timp.",
    },
    art: () => (
      <Warn>
        <Arrow d="M42 78 L42 56 Q42 44 54 42" head="66,40 52,32 54,52" color={INK} w={8} />
      </Warn>
    ),
  },
  {
    id: "w-curves",
    group: "warning",
    name: { ru: "Опасные повороты", ro: "Succesiune de curbe periculoase" },
    desc: {
      ru: "Участок дороги с несколькими опасными поворотами подряд.",
      ro: "Sector de drum cu mai multe curbe periculoase succesive.",
    },
    art: () => (
      <Warn>
        <Arrow d="M42 80 L42 70 Q42 62 52 60 Q60 58 60 50 Q60 44 52 42" head="44,40 56,32 56,50" color={INK} w={7} />
      </Warn>
    ),
  },
  {
    id: "w-descent",
    group: "warning",
    name: { ru: "Крутой спуск", ro: "Coborâre periculoasă" },
    desc: {
      ru: "Спуск с большим уклоном. На узком спуске преимущество у транспорта, движущегося на подъём.",
      ro: "Pantă cu înclinare mare. Pe o pantă îngustă prioritate are vehiculul care urcă.",
    },
    art: () => (
      <Warn>
        <polygon points="26,50 26,78 76,78" fill={INK} />
        <text x={60} y={60} textAnchor="middle" fontFamily="Arial" fontWeight={700} fontSize={14} fill={INK}>
          10%
        </text>
      </Warn>
    ),
  },
  {
    id: "w-narrowing",
    group: "warning",
    name: { ru: "Сужение дороги", ro: "Drum îngustat" },
    desc: {
      ru: "Проезжая часть сужается с обеих сторон.",
      ro: "Partea carosabilă se îngustează pe ambele părți.",
    },
    art: () => (
      <Warn>
        <g stroke={INK} strokeWidth={6} fill="none">
          <path d="M36 80 L36 64 L44 52 L44 36" />
          <path d="M64 80 L64 64 L56 52 L56 36" />
        </g>
      </Warn>
    ),
  },
  {
    id: "w-two-way",
    group: "warning",
    name: { ru: "Двустороннее движение", ro: "Circulație în ambele sensuri" },
    desc: {
      ru: "Начало участка со встречным движением после дороги с односторонним движением.",
      ro: "Începutul unui sector cu circulație în ambele sensuri după un drum cu sens unic.",
    },
    art: () => (
      <Warn>
        <Arrow d="M42 78 L42 50" head="42,38 34,52 50,52" color={INK} w={6} />
        <Arrow d="M58 38 L58 66" head="58,78 50,64 66,64" color={INK} w={6} />
      </Warn>
    ),
  },
  {
    id: "w-pedestrians",
    group: "warning",
    name: { ru: "Пешеходный переход", ro: "Trecere pentru pietoni" },
    desc: {
      ru: "Предупреждает о приближении к нерегулируемому пешеходному переходу.",
      ro: "Avertizează asupra apropierii de o trecere pentru pietoni nedirijată.",
    },
    art: () => (
      <Warn>
        <Walker t="translate(0 6) scale(0.95) translate(2 0)" />
        <Zebra y={74} />
      </Warn>
    ),
  },
  {
    id: "w-children",
    group: "warning",
    name: { ru: "Дети", ro: "Copii" },
    desc: {
      ru: "Участок у детского учреждения (школа, лагерь), где возможно появление детей на проезжей части.",
      ro: "Sector lângă o instituție pentru copii (școală, tabără), unde copiii pot apărea pe carosabil.",
    },
    art: () => (
      <Warn>
        <Walker t="translate(-12 18) scale(0.8)" />
        <Walker t="translate(14 26) scale(0.7)" />
      </Warn>
    ),
  },
  {
    id: "w-roadworks",
    group: "warning",
    name: { ru: "Дорожные работы", ro: "Lucrări" },
    desc: {
      ru: "Участок, на котором ведутся дорожные работы.",
      ro: "Sector de drum pe care se execută lucrări.",
    },
    art: () => (
      <Warn>
        <g stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none">
          <circle cx={44} cy={38} r={4.5} fill={INK} stroke="none" />
          <path d="M44 45 L40 62 L34 76 M40 62 L48 70 L50 78 M43 48 L56 56 L66 70" />
        </g>
        <path d="M58 78 Q66 66 76 78 Z" fill={INK} />
      </Warn>
    ),
  },
  {
    id: "w-slippery",
    group: "warning",
    name: { ru: "Скользкая дорога", ro: "Drum alunecos" },
    desc: {
      ru: "Участок с повышенной скользкостью проезжей части.",
      ro: "Sector de drum cu aderență redusă a carosabilului.",
    },
    art: () => (
      <Warn>
        <CarSide t="translate(22 16) scale(0.56)" />
        <g stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round">
          <path d="M34 80 Q42 74 38 68 Q35 62 42 58" />
          <path d="M58 80 Q66 74 62 68 Q59 62 66 58" />
        </g>
      </Warn>
    ),
  },
  {
    id: "w-danger",
    group: "warning",
    name: { ru: "Прочие опасности", ro: "Alte pericole" },
    desc: {
      ru: "Участок с опасностью, не предусмотренной другими предупреждающими знаками.",
      ro: "Sector cu un pericol care nu este prevăzut de alte indicatoare de avertizare.",
    },
    art: () => (
      <Warn>
        <rect x={45} y={36} width={10} height={28} rx={3} fill={INK} />
        <circle cx={50} cy={73} r={5.5} fill={INK} />
      </Warn>
    ),
  },
  {
    id: "w-cyclists",
    group: "warning",
    name: { ru: "Пересечение с велосипедной дорожкой", ro: "Traversarea unei piste pentru bicicliști" },
    desc: {
      ru: "Впереди пересечение с велосипедной дорожкой или выезд велосипедистов.",
      ro: "Urmează intersecția cu o pistă pentru bicicliști.",
    },
    art: () => (
      <Warn>
        <Bicycle t="translate(12 18) scale(0.76)" />
      </Warn>
    ),
  },
  {
    id: "w-tram",
    group: "warning",
    name: { ru: "Пересечение с трамвайной линией", ro: "Intersecție cu linia de tramvai" },
    desc: {
      ru: "Впереди пересечение с трамвайными путями вне перекрёстка.",
      ro: "Urmează traversarea unei linii de tramvai în afara intersecției.",
    },
    art: () => (
      <Warn>
        <g transform="translate(12 20) scale(0.76)">
          <Tram />
        </g>
      </Warn>
    ),
  },
  {
    id: "w-bump",
    group: "warning",
    name: { ru: "Искусственная неровность", ro: "Denivelare artificială" },
    desc: {
      ru: "Участок с искусственной неровностью для принудительного снижения скорости.",
      ro: "Sector cu denivelare artificială pentru reducerea forțată a vitezei.",
    },
    art: () => (
      <Warn>
        <path d="M22 76 L38 76 Q50 56 62 76 L78 76 L78 80 L22 80 Z" fill={INK} />
      </Warn>
    ),
  },

  // Priority
  {
    id: "p-main-road",
    group: "priority",
    name: { ru: "Главная дорога", ro: "Drum cu prioritate" },
    desc: {
      ru: "Дорога, на которой предоставлено право преимущественного проезда нерегулируемых перекрёстков.",
      ro: "Drum pe care se acordă prioritate la trecerea intersecțiilor nedirijate.",
    },
    art: () => (
      <>
        <polygon points="50,3 97,50 50,97 3,50" fill={WHITE} stroke={INK} strokeWidth={1.5} />
        <polygon points="50,17 83,50 50,83 17,50" fill={YELLOW} />
      </>
    ),
  },
  {
    id: "p-end-main",
    group: "priority",
    name: { ru: "Конец главной дороги", ro: "Sfârșitul drumului cu prioritate" },
    desc: {
      ru: "Отменяет преимущество: на ближайшем перекрёстке очерёдность определяется другими знаками или правилом «помехи справа».",
      ro: "Anulează prioritatea: la următoarea intersecție ordinea de trecere se stabilește după alte indicatoare sau regula priorității de dreapta.",
    },
    art: () => (
      <>
        <polygon points="50,3 97,50 50,97 3,50" fill={WHITE} stroke={INK} strokeWidth={1.5} />
        <polygon points="50,17 83,50 50,83 17,50" fill={YELLOW} />
        <g stroke={INK} strokeWidth={2.5}>
          {[-10, -5, 0, 5, 10].map((o) => (
            <line key={o} x1={24 + o} y1={76 + o} x2={76 + o} y2={24 + o} />
          ))}
        </g>
      </>
    ),
  },
  {
    id: "p-give-way",
    group: "priority",
    name: { ru: "Уступите дорогу", ro: "Cedează trecerea" },
    desc: {
      ru: "Водитель должен уступить дорогу транспортным средствам, движущимся по пересекаемой дороге.",
      ro: "Conducătorul trebuie să cedeze trecerea vehiculelor care circulă pe drumul pe care îl intersectează.",
    },
    art: () => (
      <polygon
        points="8,14 92,14 50,90"
        fill={WHITE}
        stroke={RED}
        strokeWidth={9}
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: "p-stop",
    group: "priority",
    name: { ru: "Движение без остановки запрещено (STOP)", ro: "Oprire (STOP)" },
    desc: {
      ru: "Нужно остановиться перед стоп-линией, а если её нет — перед краем пересекаемой проезжей части, и уступить дорогу транспорту на пересекаемой дороге.",
      ro: "Este obligatorie oprirea în fața liniei de oprire, iar în lipsa ei — la marginea părții carosabile intersectate, și cedarea trecerii vehiculelor de pe drumul intersectat.",
    },
    art: () => (
      <>
        <polygon
          points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30"
          fill={RED}
          stroke={WHITE}
          strokeWidth={3}
        />
        <Num n="STOP" color={WHITE} size={27} y={60} />
      </>
    ),
  },
  {
    id: "p-secondary-crossing",
    group: "priority",
    name: { ru: "Пересечение со второстепенной дорогой", ro: "Intersecție cu un drum fără prioritate" },
    desc: {
      ru: "Вы едете по главной дороге, впереди перекрёсток со второстепенной дорогой.",
      ro: "Circulați pe drumul cu prioritate; urmează o intersecție cu un drum fără prioritate.",
    },
    art: () => (
      <Warn>
        <rect x={45} y={34} width={10} height={44} fill={INK} />
        <rect x={30} y={54} width={40} height={5} fill={INK} />
      </Warn>
    ),
  },
  {
    id: "p-oncoming-priority",
    group: "priority",
    name: { ru: "Преимущество встречного движения", ro: "Prioritate pentru circulația din sens invers" },
    desc: {
      ru: "Запрещается въезд на узкий участок, если это может затруднить встречное движение. Уступите дорогу встречным ТС.",
      ro: "Este interzisă intrarea pe sectorul îngust dacă se stânjenește circulația din sens invers. Cedați trecerea vehiculelor din sens opus.",
    },
    art: () => (
      <Ring>
        <Arrow d="M40 76 L40 40" head="40,24 31,42 49,42" color={RED} w={7} />
        <Arrow d="M60 24 L60 60" head="60,76 51,58 69,58" color={INK} w={7} />
      </Ring>
    ),
  },
  {
    id: "p-priority-over-oncoming",
    group: "priority",
    name: { ru: "Преимущество перед встречным движением", ro: "Prioritate față de circulația din sens invers" },
    desc: {
      ru: "На узком участке дороги вы имеете преимущество перед встречными транспортными средствами.",
      ro: "Pe sectorul îngust aveți prioritate față de vehiculele care vin din sens opus.",
    },
    art: () => (
      <Square>
        <Arrow d="M40 78 L40 40" head="40,22 31,40 49,40" color={WHITE} w={7} />
        <Arrow d="M60 22 L60 60" head="60,78 51,60 69,60" color={RED} w={7} />
      </Square>
    ),
  },

  // Prohibitory
  {
    id: "r-no-entry",
    group: "prohibitory",
    name: { ru: "Въезд запрещён", ro: "Accesul interzis" },
    desc: {
      ru: "Запрещает въезд всех транспортных средств в данном направлении (обычно — выезд с дороги с односторонним движением).",
      ro: "Interzice accesul tuturor vehiculelor în această direcție (de regulă — ieșirea unui drum cu sens unic).",
    },
    art: () => (
      <>
        <circle cx={50} cy={50} r={46} fill={RED} />
        <rect x={18} y={42} width={64} height={16} fill={WHITE} />
      </>
    ),
  },
  {
    id: "r-closed",
    group: "prohibitory",
    name: { ru: "Движение запрещено", ro: "Circulația interzisă în ambele sensuri" },
    desc: {
      ru: "Запрещает движение всех транспортных средств в обоих направлениях.",
      ro: "Interzice circulația tuturor vehiculelor în ambele sensuri.",
    },
    art: () => <Ring />,
  },
  {
    id: "r-no-trucks",
    group: "prohibitory",
    name: { ru: "Движение грузовых автомобилей запрещено", ro: "Accesul interzis autocamioanelor" },
    desc: {
      ru: "Запрещает движение грузовых автомобилей и составов транспортных средств.",
      ro: "Interzice circulația autocamioanelor și a ansamblurilor de vehicule.",
    },
    art: () => (
      <Ring>
        <g transform="translate(9 6) scale(0.82)">
          <TruckSide />
        </g>
      </Ring>
    ),
  },
  {
    id: "r-no-pedestrians",
    group: "prohibitory",
    name: { ru: "Движение пешеходов запрещено", ro: "Accesul interzis pietonilor" },
    desc: {
      ru: "Запрещает движение пешеходов.",
      ro: "Interzice circulația pietonilor.",
    },
    art: () => (
      <Ring>
        <Walker t="translate(0 2)" />
      </Ring>
    ),
  },
  {
    id: "r-no-bikes",
    group: "prohibitory",
    name: { ru: "Движение на велосипедах запрещено", ro: "Accesul interzis bicicletelor" },
    desc: {
      ru: "Запрещает движение велосипедов.",
      ro: "Interzice circulația bicicletelor.",
    },
    art: () => (
      <Ring>
        <Bicycle t="translate(9 0) scale(0.82)" />
      </Ring>
    ),
  },
  {
    id: "r-no-left",
    group: "prohibitory",
    name: { ru: "Поворот налево запрещён", ro: "Viraj la stânga interzis" },
    desc: {
      ru: "Запрещает поворот налево. Разворот при этом знаке не запрещён.",
      ro: "Interzice virajul la stânga. Întoarcerea nu este interzisă de acest indicator.",
    },
    art: () => (
      <Ring>
        <Arrow d="M58 78 L58 50 Q58 42 50 42 L40 42" head="26,42 42,31 42,53" color={INK} w={8} />
        <Slash />
      </Ring>
    ),
  },
  {
    id: "r-no-right",
    group: "prohibitory",
    name: { ru: "Поворот направо запрещён", ro: "Viraj la dreapta interzis" },
    desc: {
      ru: "Запрещает поворот направо.",
      ro: "Interzice virajul la dreapta.",
    },
    art: () => (
      <Ring>
        <Arrow d="M42 78 L42 50 Q42 42 50 42 L60 42" head="74,42 58,31 58,53" color={INK} w={8} />
        <line x1={22} y1={78} x2={78} y2={22} stroke={RED} strokeWidth={8} />
      </Ring>
    ),
  },
  {
    id: "r-no-uturn",
    group: "prohibitory",
    name: { ru: "Разворот запрещён", ro: "Întoarcerea interzisă" },
    desc: {
      ru: "Запрещает разворот. Поворот налево при этом знаке разрешён.",
      ro: "Interzice întoarcerea. Virajul la stânga este permis.",
    },
    art: () => (
      <Ring>
        <Arrow d="M60 76 L60 44 Q60 30 48 30 Q36 30 36 44 L36 58" head="36,72 27,56 45,56" color={INK} w={8} />
        <Slash />
      </Ring>
    ),
  },
  {
    id: "r-no-overtaking",
    group: "prohibitory",
    name: { ru: "Обгон запрещён", ro: "Depășirea interzisă" },
    desc: {
      ru: "Запрещает обгон транспортных средств (исключения перечислены в Правилах). Действует до ближайшего перекрёстка за знаком или до знака «Конец зоны запрещения обгона».",
      ro: "Interzice depășirea vehiculelor (excepțiile sunt prevăzute de Regulament). Acționează până la prima intersecție după indicator sau până la indicatorul de sfârșit al interdicției.",
    },
    art: () => (
      <Ring>
        <CarRear x={36} color={RED} />
        <CarRear x={64} color={INK} />
      </Ring>
    ),
  },
  {
    id: "r-end-no-overtaking",
    group: "prohibitory",
    name: { ru: "Конец зоны запрещения обгона", ro: "Sfârșitul interzicerii depășirii" },
    desc: {
      ru: "Отменяет запрет обгона.",
      ro: "Anulează interdicția de depășire.",
    },
    art: () => (
      <EndRing>
        <CarRear x={36} color={GREY} />
        <CarRear x={64} color={GREY} />
      </EndRing>
    ),
  },
  {
    id: "r-speed-40",
    group: "prohibitory",
    name: { ru: "Ограничение максимальной скорости (40)", ro: "Limitare de viteză (40)" },
    desc: {
      ru: "Запрещает движение со скоростью выше указанной. Действует до ближайшего перекрёстка за знаком, до знака с другим значением или знака отмены; в населённом пункте без перекрёстков — до его конца.",
      ro: "Interzice circulația cu viteză mai mare decât cea indicată. Acționează până la prima intersecție, până la un indicator cu altă valoare sau până la indicatorul de sfârșit.",
    },
    art: () => (
      <Ring>
        <Num n="40" size={38} y={63} />
      </Ring>
    ),
  },
  {
    id: "r-speed-50",
    group: "prohibitory",
    name: { ru: "Ограничение максимальной скорости (50)", ro: "Limitare de viteză (50)" },
    desc: {
      ru: "Максимальная разрешённая скорость — 50 км/ч в зоне действия знака.",
      ro: "Viteza maximă admisă — 50 km/h în zona de acțiune a indicatorului.",
    },
    art: () => (
      <Ring>
        <Num n="50" size={38} y={63} />
      </Ring>
    ),
  },
  {
    id: "r-end-speed-40",
    group: "prohibitory",
    name: { ru: "Конец зоны ограничения максимальной скорости", ro: "Sfârșitul limitării de viteză" },
    desc: {
      ru: "Отменяет ограничение скорости, введённое знаком с тем же значением.",
      ro: "Anulează limitarea de viteză introdusă de indicatorul cu aceeași valoare.",
    },
    art: () => (
      <EndRing>
        <Num n="40" size={38} y={63} color={GREY} />
      </EndRing>
    ),
  },
  {
    id: "r-no-horn",
    group: "prohibitory",
    name: { ru: "Подача звукового сигнала запрещена", ro: "Semnale sonore interzise" },
    desc: {
      ru: "Запрещает звуковой сигнал, кроме случаев, когда он нужен для предотвращения дорожно-транспортного происшествия.",
      ro: "Interzice semnalele sonore, cu excepția cazurilor în care sunt necesare pentru prevenirea unui accident.",
    },
    art: () => (
      <Ring>
        <Horn />
        <Slash />
      </Ring>
    ),
  },
  {
    id: "r-no-stopping",
    group: "prohibitory",
    name: { ru: "Остановка запрещена", ro: "Oprirea interzisă" },
    desc: {
      ru: "Запрещает остановку и стоянку транспортных средств на той стороне дороги, где установлен знак.",
      ro: "Interzice oprirea și staționarea vehiculelor pe partea drumului unde este instalat indicatorul.",
    },
    art: () => (
      <Ring fill={BLUE}>
        <line x1={22} y1={22} x2={78} y2={78} stroke={RED} strokeWidth={9} />
        <line x1={78} y1={22} x2={22} y2={78} stroke={RED} strokeWidth={9} />
      </Ring>
    ),
  },
  {
    id: "r-no-parking",
    group: "prohibitory",
    name: { ru: "Стоянка запрещена", ro: "Staționarea interzisă" },
    desc: {
      ru: "Запрещает стоянку. Остановка (например, для посадки и высадки пассажиров) разрешена.",
      ro: "Interzice staționarea. Oprirea (de exemplu, pentru urcarea și coborârea pasagerilor) este permisă.",
    },
    art: () => (
      <Ring fill={BLUE}>
        <line x1={22} y1={22} x2={78} y2={78} stroke={RED} strokeWidth={9} />
      </Ring>
    ),
  },
  {
    id: "r-no-parking-odd",
    group: "prohibitory",
    name: { ru: "Стоянка запрещена по нечётным числам месяца", ro: "Staționarea interzisă în zilele impare" },
    desc: {
      ru: "Стоянка запрещена по нечётным числам месяца (одна вертикальная черта).",
      ro: "Staționarea este interzisă în zilele impare ale lunii (o linie verticală).",
    },
    art: () => (
      <Ring fill={BLUE}>
        <rect x={46} y={26} width={8} height={48} fill={WHITE} />
      </Ring>
    ),
  },
  {
    id: "r-no-parking-even",
    group: "prohibitory",
    name: { ru: "Стоянка запрещена по чётным числам месяца", ro: "Staționarea interzisă în zilele pare" },
    desc: {
      ru: "Стоянка запрещена по чётным числам месяца (две вертикальные черты).",
      ro: "Staționarea este interzisă în zilele pare ale lunii (două linii verticale).",
    },
    art: () => (
      <Ring fill={BLUE}>
        <rect x={38} y={26} width={8} height={48} fill={WHITE} />
        <rect x={54} y={26} width={8} height={48} fill={WHITE} />
      </Ring>
    ),
  },
  {
    id: "r-weight",
    group: "prohibitory",
    name: { ru: "Ограничение массы", ro: "Limitare de masă" },
    desc: {
      ru: "Запрещает движение транспортных средств, фактическая масса которых больше указанной на знаке.",
      ro: "Interzice circulația vehiculelor a căror masă efectivă depășește valoarea indicată.",
    },
    art: () => (
      <Ring>
        <Num n="5t" size={34} y={62} />
      </Ring>
    ),
  },
  {
    id: "r-height",
    group: "prohibitory",
    name: { ru: "Ограничение высоты", ro: "Limitare de înălțime" },
    desc: {
      ru: "Запрещает движение транспортных средств, габаритная высота которых (с грузом или без) больше указанной.",
      ro: "Interzice circulația vehiculelor cu înălțimea (cu sau fără încărcătură) mai mare decât cea indicată.",
    },
    art: () => (
      <Ring>
        <polygon points="42,20 58,20 50,30" fill={INK} />
        <polygon points="42,80 58,80 50,70" fill={INK} />
        <Num n="3.5" size={26} y={59} />
      </Ring>
    ),
  },
  {
    id: "r-end-all",
    group: "prohibitory",
    name: { ru: "Конец зоны всех ограничений", ro: "Sfârșitul tuturor restricțiilor" },
    desc: {
      ru: "Одновременно отменяет действие нескольких запрещающих знаков (запрет обгона, ограничение скорости, запрет звукового сигнала и др.).",
      ro: "Anulează simultan mai multe interdicții (depășire, limitare de viteză, semnale sonore etc.).",
    },
    art: () => <EndRing />,
  },

  // Mandatory
  {
    id: "m-straight",
    group: "mandatory",
    name: { ru: "Движение прямо", ro: "Înainte" },
    desc: {
      ru: "Разрешено движение только прямо. Действует на пересечение проезжих частей, перед которым установлен.",
      ro: "Este permisă doar circulația înainte. Acționează asupra intersecției în fața căreia este instalat.",
    },
    art: () => (
      <Blue>
        <Arrow d="M50 82 L50 38" head="50,16 68,40 32,40" />
      </Blue>
    ),
  },
  {
    id: "m-right",
    group: "mandatory",
    name: { ru: "Движение направо", ro: "La dreapta" },
    desc: {
      ru: "Разрешено движение только направо.",
      ro: "Este permisă doar circulația la dreapta.",
    },
    art: () => (
      <Blue>
        <Arrow d="M40 84 L40 52 Q40 42 50 42 L62 42" head="84,42 62,26 62,58" />
      </Blue>
    ),
  },
  {
    id: "m-left",
    group: "mandatory",
    name: { ru: "Движение налево", ro: "La stânga" },
    desc: {
      ru: "Разрешено движение только налево. Разворот при этом тоже разрешён.",
      ro: "Este permisă doar circulația la stânga. Întoarcerea este de asemenea permisă.",
    },
    art: () => (
      <Blue>
        <Arrow d="M60 84 L60 52 Q60 42 50 42 L38 42" head="16,42 38,26 38,58" />
      </Blue>
    ),
  },
  {
    id: "m-straight-right",
    group: "mandatory",
    name: { ru: "Движение прямо или направо", ro: "Înainte sau la dreapta" },
    desc: {
      ru: "Разрешено движение только прямо или направо.",
      ro: "Este permisă doar circulația înainte sau la dreapta.",
    },
    art: () => (
      <Blue>
        <Arrow d="M40 84 L40 36" head="40,14 55,36 25,36" w={9} />
        <Arrow d="M40 68 Q40 56 52 56 L64 56" head="84,56 64,43 64,69" w={9} />
      </Blue>
    ),
  },
  {
    id: "m-straight-left",
    group: "mandatory",
    name: { ru: "Движение прямо или налево", ro: "Înainte sau la stânga" },
    desc: {
      ru: "Разрешено движение только прямо или налево (и разворот).",
      ro: "Este permisă doar circulația înainte sau la stânga (și întoarcerea).",
    },
    art: () => (
      <Blue>
        <Arrow d="M60 84 L60 36" head="60,14 75,36 45,36" w={9} />
        <Arrow d="M60 68 Q60 56 48 56 L36 56" head="16,56 36,43 36,69" w={9} />
      </Blue>
    ),
  },
  {
    id: "m-keep-right",
    group: "mandatory",
    name: { ru: "Объезд препятствия справа", ro: "Ocolirea obstacolului pe dreapta" },
    desc: {
      ru: "Объезд разделительной полосы или препятствия разрешается только справа.",
      ro: "Ocolirea obstacolului sau a zonei de separare este permisă doar pe partea dreaptă.",
    },
    art: () => (
      <Blue>
        <Arrow d="M28 28 L62 62" head="78,78 52,74 74,52" />
      </Blue>
    ),
  },
  {
    id: "m-roundabout",
    group: "mandatory",
    name: { ru: "Круговое движение", ro: "Sens giratoriu" },
    desc: {
      ru: "Движение по кольцу разрешено только в направлении стрелок (против часовой стрелки).",
      ro: "Circulația în giratoriu este permisă doar în direcția săgeților (în sens invers acelor de ceasornic).",
    },
    art: () => (
      <Blue>
        <Roundabout color={WHITE} />
      </Blue>
    ),
  },
  {
    id: "m-bike",
    group: "mandatory",
    name: { ru: "Велосипедная дорожка", ro: "Pistă pentru bicicliști" },
    desc: {
      ru: "Разрешено движение только на велосипедах (и пешеходов, если нет тротуара или пешеходной дорожки).",
      ro: "Este permisă doar circulația bicicletelor (și a pietonilor, dacă lipsește trotuarul).",
    },
    art: () => (
      <Blue>
        <Bicycle color={WHITE} t="translate(6 -2) scale(0.88)" />
      </Blue>
    ),
  },
  {
    id: "m-footpath",
    group: "mandatory",
    name: { ru: "Пешеходная дорожка", ro: "Pistă pentru pietoni" },
    desc: {
      ru: "Разрешено движение только пешеходов.",
      ro: "Este permisă doar circulația pietonilor.",
    },
    art: () => (
      <Blue>
        <Walker color={WHITE} t="translate(-2 2)" />
      </Blue>
    ),
  },
  {
    id: "m-min-speed",
    group: "mandatory",
    name: { ru: "Ограничение минимальной скорости", ro: "Viteza minimă obligatorie" },
    desc: {
      ru: "Разрешается движение только с указанной или большей скоростью (км/ч).",
      ro: "Este permisă circulația doar cu viteza indicată sau mai mare (km/h).",
    },
    art: () => (
      <Blue>
        <Num n="30" color={WHITE} size={38} y={63} />
      </Blue>
    ),
  },

  // Information
  {
    id: "i-motorway",
    group: "info",
    name: { ru: "Автомагистраль", ro: "Autostradă" },
    desc: {
      ru: "Дорога, на которой действуют требования Правил, устанавливающие порядок движения по автомагистралям.",
      ro: "Drum pe care se aplică prevederile Regulamentului privind circulația pe autostrăzi.",
    },
    art: () => (
      <Square fill="#1a7f3c">
        <path d="M20 86 L42 34 L48 34 L40 86 Z M80 86 L58 34 L52 34 L60 86 Z" fill={WHITE} />
        <rect x={22} y={40} width={56} height={7} fill={WHITE} />
      </Square>
    ),
  },
  {
    id: "i-end-motorway",
    group: "info",
    name: { ru: "Конец автомагистрали", ro: "Sfârșitul autostrăzii" },
    desc: {
      ru: "Конец участка, на котором действуют правила движения по автомагистралям.",
      ro: "Sfârșitul sectorului pe care se aplică regulile de circulație pe autostrăzi.",
    },
    art: () => (
      <Square fill="#1a7f3c">
        <path d="M20 86 L42 34 L48 34 L40 86 Z M80 86 L58 34 L52 34 L60 86 Z" fill={WHITE} />
        <rect x={22} y={40} width={56} height={7} fill={WHITE} />
        <line x1={14} y1={86} x2={86} y2={14} stroke={RED} strokeWidth={7} />
      </Square>
    ),
  },
  {
    id: "i-one-way",
    group: "info",
    name: { ru: "Дорога с односторонним движением", ro: "Drum cu sens unic" },
    desc: {
      ru: "Движение по всей ширине проезжей части осуществляется в одном направлении.",
      ro: "Circulația pe toată lățimea părții carosabile se face într-un singur sens.",
    },
    art: () => (
      <Square>
        <Arrow d="M50 84 L50 36" head="50,14 68,38 32,38" />
      </Square>
    ),
  },
  {
    id: "i-crosswalk",
    group: "info",
    name: { ru: "Пешеходный переход", ro: "Trecere pentru pietoni" },
    desc: {
      ru: "Обозначает место пешеходного перехода. Водитель обязан уступить дорогу пешеходам на нерегулируемом переходе.",
      ro: "Marchează trecerea pentru pietoni. La trecerea nedirijată conducătorul trebuie să cedeze trecerea pietonilor.",
    },
    art: () => (
      <Square>
        <polygon points="50,14 88,84 12,84" fill={WHITE} />
        <Walker t="translate(0 12) scale(0.9) translate(4 0)" />
        <Zebra y={74} />
      </Square>
    ),
  },
  {
    id: "i-residential",
    group: "info",
    name: { ru: "Жилая зона", ro: "Zonă rezidențială" },
    desc: {
      ru: "Территория, где действуют особые правила: приоритет пешеходов, скорость не более 20 км/ч, запрет сквозного движения и учебной езды.",
      ro: "Teritoriu cu reguli speciale: prioritatea pietonilor, viteza de cel mult 20 km/h, interzicerea tranzitului și a instruirii.",
    },
    art: () => (
      <Square>
        <rect x={16} y={16} width={68} height={68} fill={WHITE} />
        <path d="M22 42 L35 30 L48 42 L48 58 L22 58 Z" fill={BLUE} />
        <Walker color={BLUE} t="translate(38 14) scale(0.52)" />
        <CarSide color={BLUE} t="translate(24 42) scale(0.52)" />
      </Square>
    ),
  },
  {
    id: "i-end-residential",
    group: "info",
    name: { ru: "Конец жилой зоны", ro: "Sfârșitul zonei rezidențiale" },
    desc: {
      ru: "Выезжая из жилой зоны, водитель должен уступить дорогу остальным участникам движения.",
      ro: "La ieșirea din zona rezidențială conducătorul trebuie să cedeze trecerea celorlalți participanți la trafic.",
    },
    art: () => (
      <Square>
        <rect x={16} y={16} width={68} height={68} fill={WHITE} />
        <path d="M22 42 L35 30 L48 42 L48 58 L22 58 Z" fill={BLUE} />
        <Walker color={BLUE} t="translate(38 14) scale(0.52)" />
        <CarSide color={BLUE} t="translate(24 42) scale(0.52)" />
        <line x1={16} y1={84} x2={84} y2={16} stroke={RED} strokeWidth={7} />
      </Square>
    ),
  },
  {
    id: "i-parking",
    group: "info",
    name: { ru: "Место стоянки", ro: "Parcare" },
    desc: {
      ru: "Обозначает место, где разрешена стоянка транспортных средств.",
      ro: "Indică locul unde este permisă staționarea vehiculelor.",
    },
    art: () => (
      <Square>
        <Num n="P" color={WHITE} size={62} y={73} />
      </Square>
    ),
  },
  {
    id: "i-dead-end",
    group: "info",
    name: { ru: "Тупик", ro: "Drum fără ieșire" },
    desc: {
      ru: "Дорога без сквозного проезда.",
      ro: "Drum fără ieșire.",
    },
    art: () => (
      <Square>
        <rect x={42} y={34} width={16} height={52} fill={WHITE} />
        <rect x={24} y={20} width={52} height={16} fill={RED} />
      </Square>
    ),
  },
  {
    id: "i-bus-stop",
    group: "info",
    name: { ru: "Место остановки автобуса и (или) троллейбуса", ro: "Stație de autobuz și/sau troleibuz" },
    desc: {
      ru: "Обозначает остановку маршрутных транспортных средств.",
      ro: "Indică stația vehiculelor de transport public.",
    },
    art: () => (
      <Square>
        <rect x={16} y={16} width={68} height={68} rx={3} fill={WHITE} />
        <Bus />
      </Square>
    ),
  },
  {
    id: "i-locality",
    group: "info",
    name: { ru: "Начало населённого пункта", ro: "Intrarea în localitate" },
    desc: {
      ru: "Название и начало населённого пункта, в котором действуют требования Правил для населённых пунктов (в том числе ограничение скорости 50 км/ч).",
      ro: "Denumirea și începutul localității în care se aplică regulile pentru localități (inclusiv limita de 50 km/h).",
    },
    art: () => (
      <>
        <rect x={3} y={24} width={94} height={52} rx={5} fill={WHITE} stroke={INK} strokeWidth={3} />
        <Num n="CHIȘINĂU" size={15} y={55} />
      </>
    ),
  },
  {
    id: "i-end-locality",
    group: "info",
    name: { ru: "Конец населённого пункта", ro: "Ieșirea din localitate" },
    desc: {
      ru: "Место, с которого прекращают действовать требования Правил для населённых пунктов.",
      ro: "Locul de unde încetează să se aplice regulile pentru localități.",
    },
    art: () => (
      <>
        <rect x={3} y={24} width={94} height={52} rx={5} fill={WHITE} stroke={INK} strokeWidth={3} />
        <Num n="CHIȘINĂU" size={15} y={55} />
        <line x1={10} y1={70} x2={90} y2={30} stroke={RED} strokeWidth={6} />
      </>
    ),
  },

  // Service
  {
    id: "s-first-aid",
    group: "service",
    name: { ru: "Пункт первой медицинской помощи", ro: "Punct de prim ajutor medical" },
    desc: {
      ru: "Указывает расположение пункта первой медицинской помощи.",
      ro: "Indică amplasarea punctului de prim ajutor medical.",
    },
    art: () => (
      <Square>
        <rect x={20} y={20} width={60} height={60} fill={WHITE} />
        <rect x={43} y={28} width={14} height={44} fill={RED} />
        <rect x={28} y={43} width={44} height={14} fill={RED} />
      </Square>
    ),
  },
  {
    id: "s-fuel",
    group: "service",
    name: { ru: "Автозаправочная станция", ro: "Stație de alimentare cu carburant" },
    desc: {
      ru: "Указывает расположение автозаправочной станции.",
      ro: "Indică amplasarea stației de alimentare.",
    },
    art: () => (
      <Square>
        <rect x={20} y={20} width={60} height={60} fill={WHITE} />
        <rect x={32} y={30} width={24} height={40} rx={2} fill={INK} />
        <rect x={36} y={34} width={16} height={10} fill={WHITE} />
        <path d="M56 42 L64 46 L64 64 Q64 68 68 66 L68 44" fill="none" stroke={INK} strokeWidth={3} />
      </Square>
    ),
  },
];

export const SIGN_BY_ID: Record<string, SignDef> = Object.fromEntries(
  SIGNS.map((s) => [s.id, s]),
);
