/**
 * Pick a random index in the range [0, length).
 * Optionally avoids repeating a previous index.
 */
export function pickIndex(length: number, avoid: number = -1): number {
  if (length <= 1) {
    return 0;
  }
  let index = Math.floor(Math.random() * length);
  while (index === avoid) {
    index = Math.floor(Math.random() * length);
  }
  return index;
}

/**
 * Build a "reel" sequence of indexes for a slot-machine style spin:
 * a run of pseudo-random filler indexes that ends exactly on `finalIndex`.
 */
export function buildReelSequence(
  length: number,
  finalIndex: number,
  fillerCount: number,
): number[] {
  const sequence: number[] = [];
  let last = -1;
  for (let i = 0; i < fillerCount; i++) {
    const next = pickIndex(length, last);
    sequence.push(next);
    last = next;
  }
  sequence.push(finalIndex);
  return sequence;
}
