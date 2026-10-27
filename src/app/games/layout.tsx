import type { Metadata, Viewport } from "next";
import { Inter, Unbounded } from "next/font/google";
import "./games.css";

const inter = Inter({
  variable: "--font-wg-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

const unbounded = Unbounded({
  variable: "--font-wg-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Игры для двоих — словесные дуэли",
    template: "%s · Игры для двоих",
  },
  description:
    "Вордл на двоих: дуэль на одном телефоне, общая доска, вызов другу по ссылке и «Быки и коровы».",
  openGraph: {
    title: "Игры для двоих — словесные дуэли",
    description: "Вордл-дуэль, общая доска, вызов по ссылке и «Быки и коровы».",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`games-root ${inter.variable} ${unbounded.variable} flex min-h-dvh flex-1 flex-col antialiased`}>
      {children}
    </div>
  );
}
