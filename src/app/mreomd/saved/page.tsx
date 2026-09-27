import type { Metadata } from "next";
import { Suspense } from "react";
import Saved from "../views/Saved";

export const metadata: Metadata = { title: "Сохранённые вопросы" };

export default function SavedPage() {
  return (
    <Suspense fallback={null}>
      <Saved />
    </Suspense>
  );
}
