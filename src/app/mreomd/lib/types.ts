export type Lang = "ru" | "ro";

/**
 * Text in the exam languages (the ASP exam is taken in Romanian or Russian).
 * Romanian may be missing for imported questions — Russian is the fallback.
 */
export type L = { ru: string; ro?: string };

/** Topic id — see TOPICS in data/meta.ts. Kept open so an imported bank can bring its own topics. */
export type TopicId = string;

/** Vehicle groups a question is specific to. Questions without `veh` apply to every category. */
export type VehicleGroup =
  | "moto"
  | "car"
  | "truck"
  | "bus"
  | "trailer"
  | "trolley"
  | "tractor";

/**
 * Categories as the exam question pools split them: A and B (with AM, A1, A2,
 * B1 and H) share one pool, E covers every category with a trailer.
 */
export type CategoryCode = "AB" | "C" | "D" | "E" | "F";

export type Illustration =
  | { kind: "sign"; id: string }
  | { kind: "signs"; ids: string[] }
  /** Picture from the question bank, served from /public (e.g. "/mreomd/q/123.jpg"). */
  | { kind: "image"; src: string; alt?: L };

export interface Question {
  id: string;
  /** Official question number in the ASP bank, when known. */
  no?: number;
  /** Ticket (bilet) number, when the source groups questions into tickets. */
  ticket?: number;
  topic: TopicId;
  veh?: VehicleGroup[];
  q: L;
  a: L[];
  /** Index of the correct answer in `a`. */
  c: number;
  /** Explanation of the correct answer. */
  e?: L;
  /** Reference to the regulation (chapter / section), shown as a hint. */
  ref?: L;
  img?: Illustration;
}

export interface Topic {
  id: TopicId;
  name: L;
  icon: string;
}

export interface ExamFormat {
  questions: number;
  minutes: number;
  minCorrect: number;
}

export interface Category {
  code: CategoryCode;
  name: L;
  /** Licence categories this pool covers, e.g. "A, B, AM, A1, A2, B1, H". */
  covers: string;
  icons: string;
  groups: VehicleGroup[];
  format: "short" | "long";
}
