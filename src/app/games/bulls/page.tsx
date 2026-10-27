import type { Metadata } from "next";
import BullsGame from "../views/BullsGame";

export const metadata: Metadata = { title: "Быки и коровы" };

export default function Page() {
  return <BullsGame />;
}
