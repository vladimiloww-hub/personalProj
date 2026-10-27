import type { Metadata } from "next";
import DuelGame from "../views/DuelGame";

export const metadata: Metadata = { title: "Вордл-дуэль" };

export default function Page() {
  return <DuelGame />;
}
