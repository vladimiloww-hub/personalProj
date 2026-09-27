import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Shell from "./components/Shell";
import "./mreomd.css";

const inter = Inter({
  variable: "--font-mr-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MREO.md — подготовка к экзамену ПДД в Молдове",
    template: "%s · MREO.md",
  },
  description:
    "Тренажёр теоретического экзамена ASP (Молдова): экзамен на время, тренировка по темам, поиск по вопросам, избранное и свои списки, работа над ошибками, дорожные знаки.",
  openGraph: {
    title: "MREO.md — подготовка к экзамену ПДД в Молдове",
    description: "Экзамен ASP на время, вопросы по темам, поиск, избранное, ошибки и знаки.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
  ],
};

export default function MreomdLayout({ children }: { children: React.ReactNode }) {
  return <Shell fontClass={inter.variable}>{children}</Shell>;
}
