import type { Metadata } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./randomizer.css";

const inter = Inter({
  variable: "--font-rnd-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  variable: "--font-rnd-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Random Brief — Ниша, Настроение, Название, Цвета",
  description:
    "Генератор случайного брифа: ниша, настроение, название и цветовая палитра одним нажатием.",
};

export default function RandomizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`randomizer-root ${inter.variable} ${unbounded.variable} flex min-h-full flex-1 flex-col antialiased`}
    >
      {children}
    </div>
  );
}
