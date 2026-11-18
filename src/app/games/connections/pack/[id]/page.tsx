import type { Metadata } from "next";
import PackGame from "../../../views/connections/PackGame";

export const metadata: Metadata = { title: "Связи — набор" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PackGame id={(await params).id} />;
}
