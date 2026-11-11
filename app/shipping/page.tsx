import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { shipping } from "@/lib/legal";

export const metadata: Metadata = { title: shipping.title };
export default function Page() { return <LegalPage doc={shipping} />; }
