import type { Metadata } from "next";
import Info from "../views/Info";

export const metadata: Metadata = { title: "Как проходит экзамен" };

export default function InfoPage() {
  return <Info />;
}
