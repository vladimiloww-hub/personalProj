/** Russian plural form: plural(3, ["ход", "хода", "ходов"]) → "хода". */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const MOVES: [string, string, string] = ["ход", "хода", "ходов"];
