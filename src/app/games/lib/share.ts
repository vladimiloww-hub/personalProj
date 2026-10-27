export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/** Native share sheet where there is one (phones), the clipboard otherwise. */
export async function shareOrCopy(data: { title?: string; text: string; url?: string }): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // Some desktop browsers expose share() but refuse it — fall back to copying.
    }
  }
  return copyText(data.url ? `${data.text}\n${data.url}` : data.text);
}

export async function copyText(text: string): Promise<ShareOutcome> {
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
