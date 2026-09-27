import type { Question } from "../lib/types";

/**
 * Temporary starter set of practice questions written from the general
 * provisions of the RCR (HG nr. 357/2009). It is NOT the official ASP bank —
 * replace/extend it by importing the official questions (see README.md).
 */
export const IS_DEMO_BANK = true;

export const QUESTIONS: Question[] = [
  // ——— general ———
  {
    id: "demo-001",
    topic: "general",
    q: { ru: "Что означает требование «уступить дорогу»?", ro: "Ce înseamnă obligația de „a ceda trecerea”?" },
    a: [
      {
        ru: "Не начинать, не возобновлять и не продолжать движение, не совершать манёвр, если это вынудит участников движения, имеющих преимущество, изменить направление или скорость",
        ro: "A nu porni, a nu relua și a nu continua deplasarea, a nu efectua manevre dacă acestea obligă participanții cu prioritate să-și schimbe direcția sau viteza",
      },
      { ru: "Обязательно остановиться перед перекрёстком", ro: "A opri obligatoriu înaintea intersecției" },
      { ru: "Пропустить только пешеходов", ro: "A lăsa să treacă doar pietonii" },
    ],
    c: 0,
    e: {
      ru: "Уступить дорогу — значит не создавать помех тем, кто имеет преимущество. Остановка при этом нужна только тогда, когда без неё не обойтись.",
      ro: "A ceda trecerea înseamnă a nu stânjeni participanții care au prioritate. Oprirea este necesară doar atunci când nu se poate altfel.",
    },
  },
  {
    id: "demo-002",
    topic: "general",
    q: { ru: "Какой перекрёсток считается регулируемым?", ro: "Care intersecție este considerată dirijată?" },
    a: [
      {
        ru: "Перекрёсток, где очерёдность движения определяется сигналами светофора или регулировщика",
        ro: "Intersecția la care ordinea de trecere este stabilită de semafoare sau de agentul de circulație",
      },
      { ru: "Любой перекрёсток, где установлены знаки приоритета", ro: "Orice intersecție cu indicatoare de prioritate" },
      { ru: "Перекрёсток с круговым движением", ro: "Intersecția cu sens giratoriu" },
    ],
    c: 0,
    e: {
      ru: "Если светофор отключён или работает в режиме мигающего жёлтого, а регулировщика нет — перекрёсток нерегулируемый, и действуют знаки приоритета.",
      ro: "Dacă semaforul este deconectat sau funcționează cu galben intermitent și nu este agent, intersecția este nedirijată și se aplică indicatoarele de prioritate.",
    },
  },
  {
    id: "demo-003",
    topic: "general",
    q: {
      ru: "Какими знаками обозначаются въезды в населённый пункт и выезды из него?",
      ro: "Prin ce indicatoare sunt marcate intrările și ieșirile din localitate?",
    },
    img: { kind: "signs", ids: ["i-locality", "i-end-locality"] },
    a: [
      { ru: "Знаками начала и конца населённого пункта", ro: "Prin indicatoarele de intrare și ieșire din localitate" },
      { ru: "Только знаками ограничения скорости", ro: "Doar prin indicatoare de limitare a vitezei" },
      { ru: "Никакими — это определяется по застройке", ro: "Prin niciunul — se determină după clădiri" },
    ],
    c: 0,
    e: {
      ru: "Требования Правил для населённых пунктов (в том числе 50 км/ч) действуют от знака начала до знака конца населённого пункта.",
      ro: "Regulile pentru localități (inclusiv 50 km/h) se aplică de la indicatorul de intrare până la cel de ieșire din localitate.",
    },
  },

  // ——— drivers ———
  {
    id: "demo-010",
    topic: "drivers",
    q: {
      ru: "Какой допустимый предел концентрации алкоголя в крови установлен для водителей в Республике Молдова?",
      ro: "Care este limita admisibilă a concentrației de alcool în sânge pentru conducătorii auto în Republica Moldova?",
    },
    a: [
      { ru: "0 г/л", ro: "0 g/l" },
      { ru: "0,3 г/л", ro: "0,3 g/l" },
      { ru: "0,5 г/л", ro: "0,5 g/l" },
      { ru: "0,8 г/л", ro: "0,8 g/l" },
    ],
    c: 1,
    e: {
      ru: "Допустимые пределы: 0,3 г/л в крови или 0,15 мг/л в выдыхаемом воздухе (изменения вступили в силу 7 сентября 2024 года). Превышение наказывается штрафом или арестом, а при опьянении — и лишением права управления.",
      ro: "Limitele admisibile: 0,3 g/l în sânge sau 0,15 mg/l în aerul expirat (modificări în vigoare din 7 septembrie 2024). Depășirea se sancționează cu amendă sau arest, iar în stare de ebrietate — și cu privarea de dreptul de a conduce.",
    },
    ref: { ru: "Кодекс о правонарушениях, ст. 233", ro: "Codul contravențional, art. 233" },
  },
  {
    id: "demo-011",
    topic: "drivers",
    q: {
      ru: "Разрешается ли водителю во время движения пользоваться телефоном, держа его в руке?",
      ro: "Are voie conducătorul să folosească telefonul ținându-l în mână în timpul mersului?",
    },
    a: [
      { ru: "Разрешается, если скорость невысокая", ro: "Da, dacă viteza este mică" },
      { ru: "Разрешается только в населённом пункте", ro: "Da, doar în localitate" },
      {
        ru: "Запрещается; можно пользоваться только устройством, позволяющим вести разговор без помощи рук",
        ro: "Nu; se permite doar folosirea unui dispozitiv care permite convorbirea fără ajutorul mâinilor",
      },
    ],
    c: 2,
    e: {
      ru: "Телефон в руке отвлекает внимание и занимает руку. Во время движения допускается только гарнитура или громкая связь.",
      ro: "Telefonul în mână distrage atenția și ocupă mâna. În mers se permite doar sistemul „mâini libere”.",
    },
  },
  {
    id: "demo-012",
    topic: "drivers",
    q: {
      ru: "Кто должен быть пристёгнут ремнём безопасности во время движения?",
      ro: "Cine trebuie să poarte centura de siguranță în timpul mersului?",
    },
    a: [
      { ru: "Только водитель", ro: "Doar conducătorul" },
      { ru: "Водитель и пассажир на переднем сиденье", ro: "Conducătorul și pasagerul din față" },
      {
        ru: "Водитель и все пассажиры на местах, оборудованных ремнями безопасности",
        ro: "Conducătorul și toți pasagerii de pe locurile echipate cu centuri de siguranță",
      },
    ],
    c: 2,
    e: {
      ru: "Ремни обязательны для всех, кто сидит на оборудованных ими местах — и спереди, и сзади.",
      ro: "Centura este obligatorie pentru toți cei aflați pe locuri echipate cu ea — atât în față, cât și în spate.",
    },
  },
  {
    id: "demo-013",
    topic: "drivers",
    q: {
      ru: "Вы стали участником ДТП, в котором пострадали люди. Что нужно сделать в первую очередь?",
      ro: "Ați fost implicat într-un accident cu victime. Ce trebuie să faceți în primul rând?",
    },
    a: [
      {
        ru: "Остановиться, включить аварийную сигнализацию, выставить знак аварийной остановки, оказать первую помощь и вызвать помощь по номеру 112",
        ro: "Să opriți, să conectați semnalizarea de avarie, să instalați triunghiul reflectorizant, să acordați primul ajutor și să apelați 112",
      },
      { ru: "Отвезти автомобиль на обочину и дождаться полиции", ro: "Să mutați mașina pe acostament și să așteptați poliția" },
      { ru: "Уехать за помощью в ближайший населённый пункт", ro: "Să plecați după ajutor în cea mai apropiată localitate" },
    ],
    c: 0,
    e: {
      ru: "Нельзя покидать место ДТП и без необходимости перемещать транспорт и предметы, связанные с происшествием. Главное — обозначить место, помочь пострадавшим и вызвать экстренные службы.",
      ro: "Nu aveți voie să părăsiți locul accidentului și să mutați fără necesitate vehiculele și obiectele implicate. Principalul este să semnalizați locul, să ajutați victimele și să chemați serviciile de urgență.",
    },
  },

  // ——— signals ———
  {
    id: "demo-020",
    topic: "signals",
    q: { ru: "Что означает мигающий зелёный сигнал светофора?", ro: "Ce semnifică lumina verde intermitentă a semaforului?" },
    a: [
      {
        ru: "Разрешает движение и информирует, что время его действия истекает и вскоре будет включён запрещающий сигнал",
        ro: "Permite trecerea și informează că timpul ei expiră și în curând se va aprinde semnalul de interzicere",
      },
      { ru: "Запрещает движение", ro: "Interzice trecerea" },
      { ru: "Предупреждает о нерегулируемом перекрёстке", ro: "Avertizează asupra unei intersecții nedirijate" },
    ],
    c: 0,
    e: {
      ru: "Мигающий зелёный — это ещё разрешающий сигнал, но пора оценить, успеете ли вы проехать до жёлтого.",
      ro: "Verdele intermitent este încă un semnal de permitere, dar trebuie să apreciați dacă reușiți să treceți până la galben.",
    },
  },
  {
    id: "demo-021",
    topic: "signals",
    q: { ru: "Что означает жёлтый мигающий сигнал светофора?", ro: "Ce semnifică lumina galbenă intermitentă a semaforului?" },
    a: [
      { ru: "Запрещает движение", ro: "Interzice trecerea" },
      {
        ru: "Разрешает движение и информирует о нерегулируемом перекрёстке или пешеходном переходе, предупреждает об опасности",
        ro: "Permite trecerea și informează despre o intersecție sau trecere pentru pietoni nedirijată, avertizează asupra pericolului",
      },
      { ru: "Предупреждает о скором включении зелёного сигнала", ro: "Anunță aprinderea în curând a semnalului verde" },
    ],
    c: 1,
    e: {
      ru: "При мигающем жёлтом перекрёсток считается нерегулируемым: руководствуйтесь знаками приоритета, а при их отсутствии — правилом «помехи справа».",
      ro: "La galben intermitent intersecția se consideră nedirijată: respectați indicatoarele de prioritate, iar în lipsa lor — regula priorității de dreapta.",
    },
  },
  {
    id: "demo-022",
    topic: "signals",
    q: {
      ru: "Что означает одновременное включение красного и жёлтого сигналов светофора?",
      ro: "Ce semnifică aprinderea simultană a luminilor roșie și galbenă ale semaforului?",
    },
    a: [
      {
        ru: "Запрещает движение и информирует о предстоящем включении зелёного сигнала",
        ro: "Interzice trecerea și informează despre aprinderea iminentă a semnalului verde",
      },
      { ru: "Разрешает движение только направо", ro: "Permite doar virajul la dreapta" },
      { ru: "Светофор неисправен, перекрёсток нерегулируемый", ro: "Semaforul este defect, intersecția este nedirijată" },
    ],
    c: 0,
    e: {
      ru: "Красный с жёлтым — всё ещё запрещающий сигнал. Начинать движение можно только на зелёный.",
      ro: "Roșu cu galben este tot un semnal de interzicere. Pornirea este permisă doar la verde.",
    },
  },
  {
    id: "demo-023",
    topic: "signals",
    q: {
      ru: "Сигналы светофора противоречат знакам приоритета. Чем следует руководствоваться?",
      ro: "Semnalele semaforului contrazic indicatoarele de prioritate. Ce trebuie să respectați?",
    },
    a: [
      { ru: "Знаками приоритета", ro: "Indicatoarele de prioritate" },
      { ru: "Сигналами светофора", ro: "Semnalele semaforului" },
      { ru: "Правилом «помехи справа»", ro: "Regula priorității de dreapta" },
    ],
    c: 1,
    e: {
      ru: "Иерархия: сигналы регулировщика → сигналы светофора → знаки приоритета → разметка и общие правила.",
      ro: "Ierarhia: semnalele agentului → semnalele semaforului → indicatoarele de prioritate → marcajele și regulile generale.",
    },
  },

  // ——— signs ———
  {
    id: "demo-030",
    topic: "signs",
    img: { kind: "sign", id: "p-stop" },
    q: { ru: "Что обязывает сделать этот знак?", ro: "Ce vă obligă acest indicator?" },
    a: [
      { ru: "Снизить скорость и проехать, если нет помех", ro: "Să reduceți viteza și să treceți dacă nu sunt obstacole" },
      {
        ru: "Остановиться перед стоп-линией (или краем пересекаемой проезжей части) и уступить дорогу транспорту на пересекаемой дороге",
        ro: "Să opriți în fața liniei de oprire (sau la marginea carosabilului intersectat) și să cedați trecerea vehiculelor de pe drumul intersectat",
      },
      { ru: "Остановиться только при наличии других транспортных средств", ro: "Să opriți doar dacă sunt alte vehicule" },
    ],
    c: 1,
    e: {
      ru: "Знак «STOP» требует остановки всегда, даже если на пересекаемой дороге никого нет.",
      ro: "Indicatorul „STOP” impune oprirea întotdeauna, chiar dacă pe drumul intersectat nu este nimeni.",
    },
  },
  {
    id: "demo-031",
    topic: "signs",
    img: { kind: "sign", id: "r-no-parking" },
    q: { ru: "Разрешена ли остановка в зоне действия этого знака?", ro: "Este permisă oprirea în zona de acțiune a acestui indicator?" },
    a: [
      { ru: "Разрешена", ro: "Da" },
      { ru: "Запрещена", ro: "Nu" },
      { ru: "Разрешена только для такси", ro: "Doar pentru taxiuri" },
    ],
    c: 0,
    e: {
      ru: "Знак «Стоянка запрещена» (одна красная диагональ) запрещает только стоянку. Остановка — например, для посадки пассажиров — разрешена.",
      ro: "Indicatorul „Staționarea interzisă” (o singură diagonală roșie) interzice doar staționarea. Oprirea — de exemplu, pentru urcarea pasagerilor — este permisă.",
    },
  },
  {
    id: "demo-032",
    topic: "signs",
    img: { kind: "sign", id: "r-no-stopping" },
    q: { ru: "Что запрещает этот знак?", ro: "Ce interzice acest indicator?" },
    a: [
      { ru: "Только стоянку", ro: "Doar staționarea" },
      { ru: "Остановку и стоянку", ro: "Oprirea și staționarea" },
      { ru: "Въезд всех транспортных средств", ro: "Accesul tuturor vehiculelor" },
    ],
    c: 1,
    e: {
      ru: "Две красные диагонали (крест) на синем фоне — «Остановка запрещена»: нельзя ни останавливаться, ни стоять.",
      ro: "Două diagonale roșii (cruce) pe fond albastru — „Oprirea interzisă”: nu se permite nici oprirea, nici staționarea.",
    },
  },
  {
    id: "demo-033",
    topic: "signs",
    img: { kind: "sign", id: "r-no-entry" },
    q: { ru: "Как называется этот знак?", ro: "Cum se numește acest indicator?" },
    a: [
      { ru: "Движение запрещено", ro: "Circulația interzisă în ambele sensuri" },
      { ru: "Въезд запрещён", ro: "Accesul interzis" },
      { ru: "Остановка запрещена", ro: "Oprirea interzisă" },
    ],
    c: 1,
    e: {
      ru: "«Въезд запрещён» — красный круг с белой полосой. Его ставят, например, на выезде с дороги с односторонним движением.",
      ro: "„Accesul interzis” — cerc roșu cu bandă albă. Se instalează, de exemplu, la ieșirea unui drum cu sens unic.",
    },
  },
  {
    id: "demo-034",
    topic: "signs",
    img: { kind: "sign", id: "r-no-uturn" },
    q: { ru: "Можно ли при этом знаке повернуть налево?", ro: "Este permis virajul la stânga la acest indicator?" },
    a: [
      { ru: "Можно, знак запрещает только разворот", ro: "Da, indicatorul interzice doar întoarcerea" },
      { ru: "Нельзя", ro: "Nu" },
      { ru: "Можно только на регулируемом перекрёстке", ro: "Doar la o intersecție dirijată" },
    ],
    c: 0,
    e: {
      ru: "Знак «Разворот запрещён» не запрещает поворот налево.",
      ro: "Indicatorul „Întoarcerea interzisă” nu interzice virajul la stânga.",
    },
  },
  {
    id: "demo-035",
    topic: "signs",
    img: { kind: "sign", id: "p-main-road" },
    q: { ru: "Что обозначает этот знак?", ro: "Ce indică acest indicator?" },
    a: [
      { ru: "Пересечение равнозначных дорог", ro: "Intersecție de drumuri egale" },
      { ru: "Главную дорогу", ro: "Drum cu prioritate" },
      { ru: "Конец главной дороги", ro: "Sfârșitul drumului cu prioritate" },
    ],
    c: 1,
    e: {
      ru: "Жёлтый ромб с белой каймой — «Главная дорога»: вы имеете преимущество на нерегулируемых перекрёстках.",
      ro: "Rombul galben cu chenar alb — „Drum cu prioritate”: aveți prioritate la intersecțiile nedirijate.",
    },
  },
  {
    id: "demo-036",
    topic: "signs",
    img: { kind: "sign", id: "p-oncoming-priority" },
    q: { ru: "Что означает этот знак?", ro: "Ce semnifică acest indicator?" },
    a: [
      { ru: "Вы имеете преимущество перед встречным транспортом", ro: "Aveți prioritate față de vehiculele din sens opus" },
      {
        ru: "На узком участке нужно уступить дорогу встречному транспорту",
        ro: "Pe sectorul îngust trebuie să cedați trecerea vehiculelor din sens opus",
      },
      { ru: "Двустороннее движение", ro: "Circulație în ambele sensuri" },
    ],
    c: 1,
    e: {
      ru: "Красная стрелка — ваше направление, оно уступает. Синий квадратный знак с белой стрелкой, наоборот, даёт вам преимущество.",
      ro: "Săgeata roșie este direcția dumneavoastră, care cedează. Indicatorul pătrat albastru cu săgeată albă, dimpotrivă, vă acordă prioritate.",
    },
  },
  {
    id: "demo-037",
    topic: "signs",
    img: { kind: "sign", id: "m-left" },
    q: { ru: "Разрешён ли разворот при этом знаке?", ro: "Este permisă întoarcerea la acest indicator?" },
    a: [
      { ru: "Разрешён", ro: "Da" },
      { ru: "Запрещён", ro: "Nu" },
      { ru: "Разрешён только легковым автомобилям", ro: "Doar autoturismelor" },
    ],
    c: 0,
    e: {
      ru: "Знак «Движение налево» разрешает также и разворот.",
      ro: "Indicatorul „La stânga” permite și întoarcerea.",
    },
  },

  // ——— markings ———
  {
    id: "demo-040",
    topic: "markings",
    q: {
      ru: "Разрешается ли пересекать сплошную линию разметки, разделяющую встречные потоки?",
      ro: "Este permisă încălcarea liniei continue care separă sensurile de circulație?",
    },
    a: [
      { ru: "Разрешается при обгоне", ro: "Da, la depășire" },
      { ru: "Разрешается при повороте налево", ro: "Da, la virajul la stânga" },
      { ru: "Запрещается", ro: "Nu" },
    ],
    c: 2,
    e: {
      ru: "Сплошную линию пересекать нельзя. Прерывистую — можно с любой стороны.",
      ro: "Linia continuă nu poate fi încălcată. Linia discontinuă poate fi trecută din ambele părți.",
    },
  },
  {
    id: "demo-041",
    topic: "markings",
    q: { ru: "Для чего служит стоп-линия?", ro: "La ce servește linia de oprire?" },
    a: [
      {
        ru: "Указывает место остановки при запрещающем сигнале светофора (регулировщика) или при знаке «STOP»",
        ro: "Indică locul de oprire la semnalul de interzicere al semaforului (agentului) sau la indicatorul „STOP”",
      },
      { ru: "Обозначает начало пешеходного перехода", ro: "Marchează începutul trecerii pentru pietoni" },
      { ru: "Разделяет полосы попутного направления", ro: "Separă benzile de același sens" },
    ],
    c: 0,
    e: {
      ru: "Стоп-линия — поперечная сплошная линия. Перед ней останавливаются при запрещающем сигнале или знаке «STOP».",
      ro: "Linia de oprire este o linie continuă transversală. În fața ei se oprește la semnalul de interzicere sau la „STOP”.",
    },
  },

  // ——— priority vehicles ———
  {
    id: "demo-050",
    topic: "priority-vehicles",
    q: {
      ru: "Как поступить при приближении транспортного средства с включёнными синим проблесковым маячком и специальным звуковым сигналом?",
      ro: "Ce trebuie să faceți la apropierea unui vehicul cu girofarul albastru și semnalul sonor special în funcțiune?",
    },
    a: [
      { ru: "Продолжать движение, не меняя скорости", ro: "Să continuați deplasarea fără a schimba viteza" },
      { ru: "Уступить дорогу, обеспечив ему беспрепятственный проезд", ro: "Să cedați trecerea, asigurându-i deplasarea nestingherită" },
      { ru: "Уступить только если он движется по вашей полосе", ro: "Să cedați doar dacă circulă pe banda dumneavoastră" },
    ],
    c: 1,
    e: {
      ru: "Транспорт с синим маячком и сиреной имеет преимущество перед всеми — ему нужно освободить путь.",
      ro: "Vehiculul cu girofar albastru și sirenă are prioritate față de toți — trebuie să-i eliberați calea.",
    },
  },
  {
    id: "demo-051",
    topic: "priority-vehicles",
    q: {
      ru: "Даёт ли преимущество в движении включённый оранжевый (жёлтый) проблесковый маячок?",
      ro: "Acordă prioritate girofarul portocaliu (galben) în funcțiune?",
    },
    a: [
      { ru: "Даёт", ro: "Da" },
      { ru: "Не даёт — он лишь предупреждает об опасности", ro: "Nu — el doar avertizează asupra pericolului" },
      { ru: "Даёт только на перекрёстках", ro: "Doar în intersecții" },
    ],
    c: 1,
    e: {
      ru: "Оранжевый маячок (дорожная техника, эвакуаторы, крупногабаритные грузы) преимущества не даёт.",
      ro: "Girofarul portocaliu (utilaje de drum, tractări, transporturi agabaritice) nu acordă prioritate.",
    },
  },

  // ——— maneuvers ———
  {
    id: "demo-060",
    topic: "maneuvers",
    q: {
      ru: "Два автомобиля одновременно перестраиваются в одну полосу. Кто должен уступить дорогу?",
      ro: "Două vehicule își schimbă simultan banda spre aceeași bandă. Cine trebuie să cedeze trecerea?",
    },
    a: [
      { ru: "Тот, кто движется слева", ro: "Cel din stânga" },
      { ru: "Тот, кто движется справа", ro: "Cel din dreapta" },
      { ru: "Тот, у кого меньше скорость", ro: "Cel cu viteza mai mică" },
    ],
    c: 0,
    e: {
      ru: "При одновременном перестроении водитель, находящийся слева, уступает дорогу тому, кто справа.",
      ro: "La schimbarea simultană a benzii, conducătorul din stânga cedează trecerea celui din dreapta.",
    },
  },
  {
    id: "demo-061",
    topic: "maneuvers",
    q: { ru: "Разрешается ли движение задним ходом на перекрёстке?", ro: "Este permis mersul înapoi în intersecție?" },
    a: [
      { ru: "Разрешается, если это безопасно", ro: "Da, dacă este sigur" },
      { ru: "Запрещается", ro: "Nu" },
      { ru: "Разрешается только на нерегулируемом перекрёстке", ro: "Doar în intersecțiile nedirijate" },
    ],
    c: 1,
    e: {
      ru: "Движение задним ходом запрещено на перекрёстках, пешеходных переходах, в тоннелях, на мостах, железнодорожных переездах и в других местах, где запрещён разворот.",
      ro: "Mersul înapoi este interzis în intersecții, pe trecerile pentru pietoni, în tuneluri, pe poduri, la trecerile la nivel cu calea ferată și în alte locuri unde este interzisă întoarcerea.",
    },
  },
  {
    id: "demo-062",
    topic: "maneuvers",
    q: { ru: "Что нужно сделать перед поворотом направо?", ro: "Ce trebuie să faceți înainte de virajul la dreapta?" },
    a: [
      {
        ru: "Заблаговременно включить правый указатель поворота и занять крайнее правое положение на проезжей части",
        ro: "Să conectați din timp semnalizatorul de dreapta și să ocupați poziția extremă dreaptă pe carosabil",
      },
      { ru: "Подать звуковой сигнал", ro: "Să dați semnal sonor" },
      { ru: "Занять среднюю полосу", ro: "Să ocupați banda din mijloc" },
    ],
    c: 0,
    e: {
      ru: "Сигнал поворота подают заблаговременно, а поворот направо выполняют из крайнего правого положения, если разметкой или знаками не установлено иное.",
      ro: "Semnalul se dă din timp, iar virajul la dreapta se efectuează din poziția extremă dreaptă, dacă marcajele sau indicatoarele nu prevăd altfel.",
    },
  },

  // ——— speed ———
  {
    id: "demo-070",
    topic: "speed",
    q: {
      ru: "С какой максимальной скоростью разрешено движение в населённом пункте, если знаками не установлено иное?",
      ro: "Care este viteza maximă admisă în localitate, dacă indicatoarele nu prevăd altfel?",
    },
    a: [
      { ru: "40 км/ч", ro: "40 km/h" },
      { ru: "50 км/ч", ro: "50 km/h" },
      { ru: "60 км/ч", ro: "60 km/h" },
    ],
    c: 1,
    e: {
      ru: "В населённых пунктах Молдовы общее ограничение — 50 км/ч.",
      ro: "În localitățile din Moldova limita generală este de 50 km/h.",
    },
  },
  {
    id: "demo-071",
    topic: "speed",
    veh: ["car"],
    q: {
      ru: "С какой максимальной скоростью может двигаться легковой автомобиль вне населённого пункта (не по автомагистрали), если знаками не установлено иное?",
      ro: "Cu ce viteză maximă poate circula un autoturism în afara localității (nu pe autostradă), dacă indicatoarele nu prevăd altfel?",
    },
    a: [
      { ru: "70 км/ч", ro: "70 km/h" },
      { ru: "90 км/ч", ro: "90 km/h" },
      { ru: "110 км/ч", ro: "110 km/h" },
    ],
    c: 1,
    e: {
      ru: "Вне населённых пунктов — 90 км/ч; на дорогах, обозначенных знаком «Автомагистраль», — до 110 км/ч.",
      ro: "În afara localităților — 90 km/h; pe drumurile marcate cu indicatorul „Autostradă” — până la 110 km/h.",
    },
  },
  {
    id: "demo-072",
    topic: "speed",
    q: {
      ru: "Как изменится тормозной путь, если скорость увеличить в 2 раза?",
      ro: "Cum se modifică distanța de frânare dacă viteza se dublează?",
    },
    a: [
      { ru: "Увеличится в 2 раза", ro: "Crește de 2 ori" },
      { ru: "Увеличится примерно в 4 раза", ro: "Crește de aproximativ 4 ori" },
      { ru: "Не изменится", ro: "Nu se modifică" },
    ],
    c: 1,
    e: {
      ru: "Тормозной путь пропорционален квадрату скорости: вдвое быстрее — примерно вчетверо длиннее торможение.",
      ro: "Distanța de frânare este proporțională cu pătratul vitezei: de două ori mai repede — de aproximativ patru ori mai lungă.",
    },
  },
  {
    id: "demo-073",
    topic: "speed",
    q: {
      ru: "Какую дистанцию нужно соблюдать до движущегося впереди транспортного средства?",
      ro: "Ce distanță trebuie păstrată față de vehiculul din față?",
    },
    a: [
      { ru: "Не менее 5 метров", ro: "Cel puțin 5 metri" },
      {
        ru: "Такую, которая позволит избежать столкновения при его внезапном торможении",
        ro: "Una care permite evitarea coliziunii în cazul frânării lui bruște",
      },
      { ru: "Равную длине своего автомобиля", ro: "Egală cu lungimea propriului vehicul" },
    ],
    c: 1,
    e: {
      ru: "Безопасная дистанция зависит от скорости, состояния дороги и транспорта. Удобный ориентир на сухой дороге — не менее 2 секунд.",
      ro: "Distanța de siguranță depinde de viteză, starea drumului și a vehiculului. Un reper comod pe drum uscat — cel puțin 2 secunde.",
    },
  },

  // ——— overtaking ———
  {
    id: "demo-080",
    topic: "overtaking",
    q: { ru: "Где запрещён обгон?", ro: "Unde este interzisă depășirea?" },
    a: [
      { ru: "На пешеходных переходах", ro: "Pe trecerile pentru pietoni" },
      { ru: "На прямом участке дороги с хорошей видимостью", ro: "Pe un sector drept cu vizibilitate bună" },
      { ru: "На дороге с двумя полосами в каждом направлении", ro: "Pe un drum cu două benzi pe sens" },
    ],
    c: 0,
    e: {
      ru: "Обгон запрещён, в частности, на пешеходных переходах, железнодорожных переездах, в конце подъёма и на других участках с ограниченной видимостью.",
      ro: "Depășirea este interzisă, în special, pe trecerile pentru pietoni, la trecerile la nivel cu calea ferată, la sfârșitul rampelor și în alte locuri cu vizibilitate redusă.",
    },
  },
  {
    id: "demo-081",
    topic: "overtaking",
    q: {
      ru: "Что запрещается водителю обгоняемого транспортного средства?",
      ro: "Ce îi este interzis conducătorului vehiculului care este depășit?",
    },
    a: [
      { ru: "Снижать скорость", ro: "Să reducă viteza" },
      { ru: "Препятствовать обгону повышением скорости или иными действиями", ro: "Să împiedice depășirea prin mărirea vitezei sau alte acțiuni" },
      { ru: "Смещаться вправо", ro: "Să se deplaseze spre dreapta" },
    ],
    c: 1,
    e: {
      ru: "Обгоняемому запрещено мешать обгону — например, увеличивать скорость.",
      ro: "Celui depășit îi este interzis să împiedice depășirea — de exemplu, prin mărirea vitezei.",
    },
  },
  {
    id: "demo-082",
    topic: "overtaking",
    img: { kind: "sign", id: "r-no-overtaking" },
    q: {
      ru: "Можно ли обогнать легковой автомобиль в зоне действия этого знака?",
      ro: "Puteți depăși un autoturism în zona de acțiune a acestui indicator?",
    },
    a: [
      { ru: "Можно, если нет встречного транспорта", ro: "Da, dacă nu vin vehicule din sens opus" },
      { ru: "Нельзя", ro: "Nu" },
      { ru: "Можно вне населённого пункта", ro: "Da, în afara localității" },
    ],
    c: 1,
    e: {
      ru: "Знак «Обгон запрещён» запрещает обгонять автомобили до ближайшего перекрёстка или знака отмены.",
      ro: "Indicatorul „Depășirea interzisă” interzice depășirea autovehiculelor până la prima intersecție sau indicatorul de sfârșit.",
    },
  },

  // ——— stopping ———
  {
    id: "demo-090",
    topic: "stopping",
    q: { ru: "Разрешается ли остановка на пешеходном переходе?", ro: "Este permisă oprirea pe trecerea pentru pietoni?" },
    a: [
      { ru: "Разрешается для посадки пассажиров", ro: "Da, pentru urcarea pasagerilor" },
      { ru: "Запрещается", ro: "Nu" },
      { ru: "Разрешается ночью", ro: "Da, noaptea" },
    ],
    c: 1,
    e: {
      ru: "Остановка запрещена на пешеходных переходах и вблизи них, на железнодорожных переездах, в тоннелях и в других местах, перечисленных в Правилах.",
      ro: "Oprirea este interzisă pe trecerile pentru pietoni și în apropierea lor, la trecerile la nivel cu calea ferată, în tuneluri și în alte locuri prevăzute de Regulament.",
    },
  },
  {
    id: "demo-091",
    topic: "stopping",
    q: {
      ru: "Что должен сделать водитель, покидая своё транспортное средство?",
      ro: "Ce trebuie să facă conducătorul când părăsește vehiculul?",
    },
    a: [
      {
        ru: "Принять меры, исключающие самопроизвольное движение транспортного средства и его использование в отсутствие водителя",
        ro: "Să ia măsuri care exclud deplasarea spontană a vehiculului și folosirea lui în lipsa conducătorului",
      },
      { ru: "Включить аварийную сигнализацию", ro: "Să conecteze semnalizarea de avarie" },
      { ru: "Ничего, если отлучается ненадолго", ro: "Nimic, dacă lipsește puțin timp" },
    ],
    c: 0,
    e: {
      ru: "Нужно заглушить двигатель, включить стояночный тормоз и закрыть автомобиль.",
      ro: "Trebuie să opriți motorul, să acționați frâna de staționare și să încuiați vehiculul.",
    },
  },

  // ——— intersections ———
  {
    id: "demo-100",
    topic: "intersections",
    q: {
      ru: "На перекрёстке равнозначных дорог водитель безрельсового транспортного средства должен уступить дорогу транспорту, приближающемуся:",
      ro: "La intersecția drumurilor egale conducătorul vehiculului fără șine trebuie să cedeze trecerea vehiculelor care se apropie:",
    },
    a: [
      { ru: "Слева", ro: "Din stânga" },
      { ru: "Справа", ro: "Din dreapta" },
      { ru: "Со встречного направления", ro: "Din sens opus" },
    ],
    c: 1,
    e: {
      ru: "Правило «помехи справа»: на равнозначных дорогах уступают тем, кто приближается справа. Трамвай при этом имеет преимущество независимо от направления.",
      ro: "Regula priorității de dreapta: la drumuri egale se cedează celor care vin din dreapta. Tramvaiul are prioritate indiferent de direcție.",
    },
  },
  {
    id: "demo-101",
    topic: "intersections",
    q: {
      ru: "На перекрёстке равнозначных дорог трамвай имеет преимущество перед безрельсовыми транспортными средствами:",
      ro: "La intersecția drumurilor egale tramvaiul are prioritate față de vehiculele fără șine:",
    },
    a: [
      { ru: "Только при движении прямо", ro: "Doar când merge înainte" },
      { ru: "Независимо от направления его движения", ro: "Indiferent de direcția lui de mers" },
      { ru: "Только если приближается справа", ro: "Doar dacă vine din dreapta" },
    ],
    c: 1,
    e: {
      ru: "На равнозначных дорогах трамвай пользуется преимуществом перед безрельсовыми ТС независимо от направления движения.",
      ro: "La drumuri egale tramvaiul are prioritate față de vehiculele fără șine indiferent de direcția de mers.",
    },
  },
  {
    id: "demo-102",
    topic: "intersections",
    q: {
      ru: "Вы поворачиваете налево на зелёный сигнал светофора. Кому нужно уступить дорогу?",
      ro: "Virați la stânga la semnalul verde al semaforului. Cui trebuie să cedați trecerea?",
    },
    a: [
      { ru: "Никому — у вас зелёный", ro: "Nimănui — aveți verde" },
      {
        ru: "Транспорту со встречного направления, движущемуся прямо или направо",
        ro: "Vehiculelor din sens opus care merg înainte sau la dreapta",
      },
      { ru: "Только трамваю попутного направления", ro: "Doar tramvaiului de același sens" },
    ],
    c: 1,
    e: {
      ru: "При повороте налево на зелёный вы уступаете встречным, едущим прямо и направо, а также пешеходам на проезжей части, на которую поворачиваете.",
      ro: "La virajul la stânga pe verde cedați vehiculelor din sens opus care merg înainte sau la dreapta, precum și pietonilor de pe carosabilul în care virați.",
    },
  },
  {
    id: "demo-103",
    topic: "intersections",
    q: {
      ru: "Можно ли выезжать на перекрёсток, если за ним образовался затор?",
      ro: "Este permisă intrarea în intersecție dacă după ea s-a format ambuteiaj?",
    },
    a: [
      { ru: "Можно на зелёный сигнал", ro: "Da, la semnalul verde" },
      { ru: "Нельзя, если вы будете вынуждены остановиться на перекрёстке и создать помеху", ro: "Nu, dacă veți fi nevoit să opriți în intersecție și să creați obstacole" },
      { ru: "Можно, если вы на главной дороге", ro: "Da, dacă sunteți pe drumul cu prioritate" },
    ],
    c: 1,
    e: {
      ru: "Даже при разрешающем сигнале нельзя выезжать на перекрёсток, если из-за затора вы остановитесь на нём и помешаете поперечному движению.",
      ro: "Chiar și la semnal de permitere nu intrați în intersecție dacă din cauza ambuteiajului veți opri în ea și veți stânjeni circulația transversală.",
    },
  },
  {
    id: "demo-104",
    topic: "intersections",
    img: { kind: "sign", id: "p-give-way" },
    q: {
      ru: "Перед перекрёстком установлен этот знак. Кому вы обязаны уступить дорогу?",
      ro: "Înaintea intersecției este instalat acest indicator. Cui sunteți obligat să cedați trecerea?",
    },
    a: [
      { ru: "Только транспорту, приближающемуся справа", ro: "Doar vehiculelor care vin din dreapta" },
      {
        ru: "Всем транспортным средствам, движущимся по пересекаемой (главной) дороге",
        ro: "Tuturor vehiculelor care circulă pe drumul intersectat (cu prioritate)",
      },
      { ru: "Только пешеходам", ro: "Doar pietonilor" },
    ],
    c: 1,
    e: {
      ru: "Со второстепенной дороги уступают всем, кто едет по главной, — и слева, и справа.",
      ro: "De pe drumul fără prioritate se cedează tuturor celor care circulă pe drumul cu prioritate — din stânga și din dreapta.",
    },
  },

  // ——— pedestrians ———
  {
    id: "demo-110",
    topic: "pedestrians",
    img: { kind: "sign", id: "i-crosswalk" },
    q: {
      ru: "Как вы обязаны поступить, приближаясь к нерегулируемому пешеходному переходу?",
      ro: "Ce trebuie să faceți când vă apropiați de o trecere pentru pietoni nedirijată?",
    },
    a: [
      { ru: "Подать звуковой сигнал и продолжить движение", ro: "Să dați semnal sonor și să continuați" },
      {
        ru: "Снизить скорость или остановиться, чтобы уступить дорогу пешеходам, переходящим проезжую часть",
        ro: "Să reduceți viteza sau să opriți pentru a ceda trecerea pietonilor care traversează",
      },
      { ru: "Уступить только если пешеход на вашей полосе", ro: "Să cedați doar dacă pietonul este pe banda dumneavoastră" },
    ],
    c: 1,
    e: {
      ru: "На нерегулируемом переходе пешеход имеет преимущество. Объезжать или обгонять остановившийся перед переходом транспорт запрещено.",
      ro: "La trecerea nedirijată pietonul are prioritate. Este interzisă ocolirea sau depășirea vehiculului oprit în fața trecerii.",
    },
  },
  {
    id: "demo-111",
    topic: "pedestrians",
    q: {
      ru: "Поворачивая направо на перекрёстке, вы должны уступить дорогу пешеходам, которые:",
      ro: "Virând la dreapta în intersecție, trebuie să cedați trecerea pietonilor care:",
    },
    a: [
      { ru: "Переходят проезжую часть дороги, на которую вы поворачиваете", ro: "Traversează carosabilul drumului în care virați" },
      { ru: "Идут по тротуару", ro: "Merg pe trotuar" },
      { ru: "Никаким — пешеходы уступают автомобилям", ro: "Nimănui — pietonii cedează vehiculelor" },
    ],
    c: 0,
    e: {
      ru: "При повороте водитель уступает пешеходам и велосипедистам, пересекающим проезжую часть, на которую он поворачивает.",
      ro: "La viraj conducătorul cedează trecerea pietonilor și bicicliștilor care traversează carosabilul în care virează.",
    },
  },

  // ——— railway ———
  {
    id: "demo-120",
    topic: "railway",
    q: {
      ru: "Что означают поочерёдно мигающие красные сигналы светофора на железнодорожном переезде?",
      ro: "Ce semnifică luminile roșii intermitente alternative ale semaforului la trecerea la nivel cu calea ferată?",
    },
    a: [
      { ru: "Разрешают движение с осторожностью", ro: "Permit trecerea cu prudență" },
      { ru: "Запрещают движение через переезд", ro: "Interzic trecerea peste calea ferată" },
      { ru: "Предупреждают о неисправности светофора", ro: "Avertizează despre defectarea semaforului" },
    ],
    c: 1,
    e: {
      ru: "Мигающие красные на переезде — запрещающий сигнал: приближается поезд.",
      ro: "Luminile roșii intermitente la trecere sunt semnal de interzicere: se apropie trenul.",
    },
  },
  {
    id: "demo-121",
    topic: "railway",
    img: { kind: "sign", id: "w-rail-nobarrier" },
    q: {
      ru: "Ваш автомобиль вынужденно остановился на железнодорожном переезде. Что нужно сделать прежде всего?",
      ro: "Vehiculul dumneavoastră s-a oprit forțat pe trecerea la nivel cu calea ferată. Ce trebuie să faceți mai întâi?",
    },
    a: [
      {
        ru: "Немедленно высадить людей и принять меры для освобождения переезда",
        ro: "Să debarcați imediat oamenii și să luați măsuri pentru eliberarea trecerii",
      },
      { ru: "Попробовать завести двигатель, не выходя из машины", ro: "Să încercați să porniți motorul fără a ieși din mașină" },
      { ru: "Ждать помощи в салоне", ro: "Să așteptați ajutor în salon" },
    ],
    c: 0,
    e: {
      ru: "Главное — безопасность людей. Если освободить переезд не удаётся, нужно подавать сигналы остановки машинисту приближающегося поезда.",
      ro: "Principalul este siguranța oamenilor. Dacă trecerea nu poate fi eliberată, trebuie semnalizată oprirea mecanicului trenului care se apropie.",
    },
  },

  // ——— lights ———
  {
    id: "demo-130",
    topic: "lights",
    q: {
      ru: "Когда необходимо переключить дальний свет фар на ближний?",
      ro: "Când trebuie comutată faza de drum pe faza scurtă?",
    },
    a: [
      { ru: "Только в населённом пункте", ro: "Doar în localitate" },
      {
        ru: "При встречном разъезде и в других случаях, когда дальний свет может ослепить других водителей",
        ro: "La întâlnirea cu vehicule din sens opus și în alte cazuri când faza de drum poate orbi alți conducători",
      },
      { ru: "Только при движении за другим автомобилем на расстоянии менее 10 м", ro: "Doar când urmați un vehicul la mai puțin de 10 m" },
    ],
    c: 1,
    e: {
      ru: "Дальний свет переключают на ближний заранее при встречном разъезде, а также когда он может ослепить водителей попутных ТС.",
      ro: "Faza de drum se comută din timp pe faza scurtă la întâlnirea cu vehicule din sens opus și când poate orbi conducătorii vehiculelor din același sens.",
    },
  },
  {
    id: "demo-131",
    topic: "lights",
    q: {
      ru: "В каком случае нужно включить аварийную световую сигнализацию?",
      ro: "În ce caz trebuie conectată semnalizarea luminoasă de avarie?",
    },
    a: [
      { ru: "При остановке для посадки пассажира", ro: "La oprirea pentru urcarea unui pasager" },
      {
        ru: "При дорожно-транспортном происшествии и при вынужденной остановке там, где остановка запрещена",
        ro: "În caz de accident rutier și la oprirea forțată acolo unde oprirea este interzisă",
      },
      { ru: "При движении в сильный дождь", ro: "La deplasarea pe ploaie puternică" },
    ],
    c: 1,
    e: {
      ru: "Аварийная сигнализация предупреждает об опасности: ДТП, вынужденная остановка в запрещённом месте, ослепление светом фар, буксировка (на буксируемом ТС).",
      ro: "Semnalizarea de avarie avertizează asupra pericolului: accident, oprire forțată în loc interzis, orbire de faruri, remorcare (pe vehiculul remorcat).",
    },
  },

  // ——— towing ———
  {
    id: "demo-140",
    topic: "towing",
    q: {
      ru: "В каких условиях запрещена буксировка на гибкой сцепке?",
      ro: "În ce condiții este interzisă remorcarea cu legătură flexibilă?",
    },
    a: [
      { ru: "В тёмное время суток", ro: "Pe timp de noapte" },
      { ru: "В гололедицу", ro: "Pe polei" },
      { ru: "На дорогах с двусторонним движением", ro: "Pe drumurile cu circulație în ambele sensuri" },
    ],
    c: 1,
    e: {
      ru: "На гололёде гибкая сцепка не удерживает дистанцию: буксируемый автомобиль может догнать буксирующий.",
      ro: "Pe polei legătura flexibilă nu menține distanța: vehiculul remorcat îl poate ajunge din urmă pe cel tractor.",
    },
  },
  {
    id: "demo-141",
    topic: "towing",
    q: {
      ru: "Кто должен находиться за рулём буксируемого транспортного средства при буксировке на гибкой сцепке?",
      ro: "Cine trebuie să se afle la volanul vehiculului remorcat cu legătură flexibilă?",
    },
    a: [
      { ru: "Никто, если автомобиль исправен", ro: "Nimeni, dacă vehiculul este în stare bună" },
      { ru: "Водитель", ro: "Un conducător auto" },
      { ru: "Любой пассажир старше 16 лет", ro: "Orice pasager mai mare de 16 ani" },
    ],
    c: 1,
    e: {
      ru: "При буксировке на гибкой или жёсткой сцепке за рулём буксируемого ТС должен находиться водитель (кроме случая, когда конструкция жёсткой сцепки обеспечивает движение по колее буксирующего).",
      ro: "La remorcarea cu legătură flexibilă sau rigidă, la volanul vehiculului remorcat trebuie să se afle un conducător (cu excepția legăturii rigide care asigură urmarea traiectoriei vehiculului tractor).",
    },
  },

  // ——— transport ———
  {
    id: "demo-150",
    topic: "transport",
    veh: ["car"],
    q: {
      ru: "Можно ли перевозить ребёнка младше 12 лет на переднем сиденье легкового автомобиля без специального детского удерживающего устройства?",
      ro: "Se poate transporta un copil sub 12 ani pe scaunul din față al autoturismului fără dispozitiv special de reținere pentru copii?",
    },
    a: [
      { ru: "Можно, если он пристёгнут ремнём", ro: "Da, dacă poartă centura" },
      { ru: "Нельзя", ro: "Nu" },
      { ru: "Можно при движении в населённом пункте", ro: "Da, în localitate" },
    ],
    c: 1,
    e: {
      ru: "Детей до 12 лет перевозят с использованием детских удерживающих устройств, соответствующих росту и весу ребёнка.",
      ro: "Copiii sub 12 ani se transportă folosind dispozitive de reținere adecvate înălțimii și greutății copilului.",
    },
  },

  // ——— technical ———
  {
    id: "demo-160",
    topic: "technical",
    q: {
      ru: "В пути отказала рабочая тормозная система. Как нужно поступить?",
      ro: "Pe traseu s-a defectat sistemul de frânare de serviciu. Cum trebuie să procedați?",
    },
    a: [
      { ru: "Продолжить движение до места ремонта с малой скоростью", ro: "Să continuați cu viteză redusă până la locul de reparație" },
      { ru: "Прекратить дальнейшее движение", ro: "Să încetați deplasarea" },
      { ru: "Продолжить движение, используя стояночный тормоз", ro: "Să continuați folosind frâna de staționare" },
    ],
    c: 1,
    e: {
      ru: "При неисправности рабочей тормозной системы или рулевого управления дальнейшее движение запрещено — только буксировка (с соблюдением правил) или эвакуация.",
      ro: "La defectarea sistemului de frânare de serviciu sau a direcției, deplasarea în continuare este interzisă — doar remorcarea (conform regulilor) sau evacuarea.",
    },
  },

  // ——— safety ———
  {
    id: "demo-170",
    topic: "safety",
    q: {
      ru: "Как правильно действовать при экстренном торможении на автомобиле с ABS?",
      ro: "Cum se procedează corect la frânarea de urgență pe un vehicul cu ABS?",
    },
    a: [
      { ru: "Нажимать на педаль тормоза прерывисто", ro: "Să apăsați pedala de frână intermitent" },
      { ru: "Нажать на педаль тормоза до упора и удерживать её", ro: "Să apăsați pedala de frână la maximum și s-o mențineți" },
      { ru: "Тормозить только стояночным тормозом", ro: "Să frânați doar cu frâna de staționare" },
    ],
    c: 1,
    e: {
      ru: "ABS сама предотвращает блокировку колёс; прерывистое нажатие только увеличит тормозной путь. При этом автомобиль сохраняет управляемость.",
      ro: "ABS împiedică singur blocarea roților; apăsarea intermitentă doar mărește distanța de frânare. Vehiculul rămâne manevrabil.",
    },
  },
  {
    id: "demo-171",
    topic: "safety",
    q: {
      ru: "Как действовать, если автомобиль начало заносить при аквапланировании?",
      ro: "Ce trebuie să faceți dacă vehiculul intră în acvaplanare?",
    },
    a: [
      { ru: "Резко затормозить", ro: "Să frânați brusc" },
      { ru: "Плавно снизить скорость, отпустив педаль газа, и не делать резких поворотов руля", ro: "Să reduceți lin viteza eliberând accelerația și să evitați virajele bruște" },
      { ru: "Увеличить скорость", ro: "Să măriți viteza" },
    ],
    c: 1,
    e: {
      ru: "При аквапланировании шины теряют контакт с дорогой. Резкие действия приводят к заносу — нужно плавно сбросить скорость.",
      ro: "La acvaplanare anvelopele pierd contactul cu drumul. Acțiunile bruște duc la derapaj — trebuie redusă lin viteza.",
    },
  },
  {
    id: "demo-172",
    topic: "safety",
    q: {
      ru: "Как следует поворачивать руль при заносе задней оси вправо?",
      ro: "Cum trebuie rotit volanul la derapajul punții spate spre dreapta?",
    },
    a: [
      { ru: "Влево", ro: "Spre stânga" },
      { ru: "Вправо, в сторону заноса", ro: "Spre dreapta, în direcția derapajului" },
      { ru: "Держать руль прямо и тормозить", ro: "Să țineți volanul drept și să frânați" },
    ],
    c: 1,
    e: {
      ru: "Руль поворачивают в сторону заноса задней оси, чтобы выровнять автомобиль.",
      ro: "Volanul se rotește în direcția derapajului punții spate pentru a redresa vehiculul.",
    },
  },

  // ——— first aid ———
  {
    id: "demo-180",
    topic: "firstaid",
    q: {
      ru: "По какому номеру вызывают экстренные службы в Республике Молдова?",
      ro: "La ce număr se apelează serviciile de urgență în Republica Moldova?",
    },
    a: [
      { ru: "101", ro: "101" },
      { ru: "112", ro: "112" },
      { ru: "911", ro: "911" },
    ],
    c: 1,
    e: {
      ru: "112 — единый номер экстренных служб (полиция, скорая помощь, пожарные).",
      ro: "112 — numărul unic pentru apeluri de urgență (poliție, ambulanță, pompieri).",
    },
  },
  {
    id: "demo-181",
    topic: "firstaid",
    q: {
      ru: "Пострадавший без сознания, но дышит. В какое положение его нужно уложить?",
      ro: "Victima este inconștientă, dar respiră. În ce poziție trebuie așezată?",
    },
    a: [
      { ru: "На спину с приподнятой головой", ro: "Pe spate cu capul ridicat" },
      { ru: "В устойчивое боковое положение", ro: "În poziție laterală de siguranță" },
      { ru: "Усадить", ro: "În poziție șezândă" },
    ],
    c: 1,
    e: {
      ru: "Устойчивое боковое положение сохраняет проходимость дыхательных путей и защищает от аспирации рвотных масс.",
      ro: "Poziția laterală de siguranță menține căile respiratorii libere și protejează de aspirarea vomei.",
    },
  },
  {
    id: "demo-182",
    topic: "firstaid",
    q: {
      ru: "Как остановить сильное артериальное кровотечение из раны на бедре?",
      ro: "Cum se oprește o hemoragie arterială puternică dintr-o rană la coapsă?",
    },
    a: [
      {
        ru: "Наложить жгут выше раны и записать время его наложения",
        ro: "Să aplicați garoul deasupra rănii și să notați ora aplicării",
      },
      { ru: "Наложить жгут ниже раны", ro: "Să aplicați garoul sub rană" },
      { ru: "Промыть рану водой", ro: "Să spălați rana cu apă" },
    ],
    c: 0,
    e: {
      ru: "При артериальном кровотечении жгут накладывают выше раны (ближе к сердцу) и обязательно фиксируют время наложения.",
      ro: "La hemoragia arterială garoul se aplică deasupra rănii (mai aproape de inimă) și se notează obligatoriu ora aplicării.",
    },
  },

  // ——— law / exam ———
  {
    id: "demo-190",
    topic: "law",
    q: {
      ru: "Сколько вопросов в теоретическом тесте ASP для категории B и сколько правильных ответов нужно для сдачи?",
      ro: "Câți itemi are testul teoretic ASP pentru categoria B și câte răspunsuri corecte sunt necesare?",
    },
    a: [
      { ru: "20 вопросов, нужно 18 правильных", ro: "20 de itemi, 18 corecte" },
      { ru: "24 вопроса, нужно не менее 22 правильных", ro: "24 de itemi, cel puțin 22 corecte" },
      { ru: "30 вопросов, нужно не менее 27 правильных", ro: "30 de itemi, cel puțin 27 corecte" },
    ],
    c: 1,
    e: {
      ru: "Для категорий A, B, H и подкатегорий AM, A1, A2, B1 — 24 вопроса за 30 минут, нужно не менее 22 правильных. Для BE, C, CE, D, F, C1, C1E, D1, D1E — 30 вопросов за 38 минут, не менее 27 правильных.",
      ro: "Pentru categoriile A, B, H și subcategoriile AM, A1, A2, B1 — 24 de itemi în 30 de minute, cel puțin 22 corecte. Pentru BE, C, CE, D, F, C1, C1E, D1, D1E — 30 de itemi în 38 de minute, cel puțin 27 corecte.",
    },
    ref: { ru: "ASP: экзамен — теоретическая часть", ro: "ASP: examinarea la proba teoretică" },
  },
];
