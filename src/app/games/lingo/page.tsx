import type { Metadata } from "next";
import LingoGame from "../views/LingoGame";

export const metadata: Metadata = { title: "Общая доска" };

export default function Page() {
  return <LingoGame />;
}
