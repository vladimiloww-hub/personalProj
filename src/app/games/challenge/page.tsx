import type { Metadata } from "next";
import ChallengeGame from "../views/ChallengeGame";

export const metadata: Metadata = { title: "Вызов по ссылке" };

export default function Page() {
  return <ChallengeGame />;
}
