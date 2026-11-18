import type { Metadata } from "next";
import PacksList from "../../views/connections/PacksList";

export const metadata: Metadata = { title: "Наборы «Связей»" };

export default function Page() {
  return <PacksList />;
}
