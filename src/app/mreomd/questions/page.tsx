import type { Metadata } from "next";
import { Suspense } from "react";
import QuestionBrowser from "../views/QuestionBrowser";

export const metadata: Metadata = { title: "Вопросы и поиск" };

export default function QuestionsPage() {
  return (
    <Suspense fallback={null}>
      <QuestionBrowser />
    </Suspense>
  );
}
