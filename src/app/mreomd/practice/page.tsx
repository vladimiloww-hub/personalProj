import type { Metadata } from "next";
import { Suspense } from "react";
import Practice from "../views/Practice";

export const metadata: Metadata = { title: "Тренировка" };

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <Practice />
    </Suspense>
  );
}
