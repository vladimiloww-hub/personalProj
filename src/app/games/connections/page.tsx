import type { Metadata } from "next";
import ConnectionsGame from "../views/ConnectionsGame";

export const metadata: Metadata = {
  title: "Связи",
  description: "Каждый день новая головоломка: найди четыре группы по четыре слова.",
};

export default function Page() {
  return <ConnectionsGame />;
}
