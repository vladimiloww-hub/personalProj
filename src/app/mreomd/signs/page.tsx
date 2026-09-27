import type { Metadata } from "next";
import Signs from "../views/Signs";

export const metadata: Metadata = { title: "Дорожные знаки" };

export default function SignsPage() {
  return <Signs />;
}
