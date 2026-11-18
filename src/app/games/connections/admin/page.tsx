import type { Metadata } from "next";
import { isAdmin } from "@/lib/games/admin";
import { getConnectionsStore } from "@/lib/games/connections/store";
import ConnectionsAdmin from "../../views/connections/Admin";

export const metadata: Metadata = {
  title: "Админка «Связей»",
  robots: { index: false, follow: false },
};

export default async function Page() {
  return <ConnectionsAdmin authed={await isAdmin()} storeReady={!!getConnectionsStore()} />;
}
