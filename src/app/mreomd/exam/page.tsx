import type { Metadata } from "next";
import { Suspense } from "react";
import Exam from "../views/Exam";

export const metadata: Metadata = { title: "Экзамен" };

export default function ExamPage() {
  return (
    <Suspense fallback={null}>
      <Exam />
    </Suspense>
  );
}
