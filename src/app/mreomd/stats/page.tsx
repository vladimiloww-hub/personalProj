import type { Metadata } from "next";
import Stats from "../views/Stats";

export const metadata: Metadata = { title: "Статистика и настройки" };

export default function StatsPage() {
  return <Stats />;
}
