import { DEFAULT_NAMES, cleanName } from "./names";
import { persisted } from "./persist";

export { DEFAULT_NAMES, NAME_MAX, cleanName } from "./names";

/** The last names typed in, so every game starts with them filled in. */
export const playerNames = persisted<[string, string]>("games:players", DEFAULT_NAMES, (raw) =>
  Array.isArray(raw) ? [cleanName(raw[0], DEFAULT_NAMES[0]), cleanName(raw[1], DEFAULT_NAMES[1])] : null,
);
