import type { Metadata } from "next";
import OnlineRoom from "../../views/online/OnlineRoom";
import { normalizeCode } from "../../lib/online/types";

export const metadata: Metadata = {
  title: "Онлайн-игра",
  robots: { index: false, follow: false },
};

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  return <OnlineRoom code={normalizeCode((await params).code)} />;
}
