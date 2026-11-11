import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { terms } from "@/lib/legal";

export const metadata: Metadata = { title: terms.title };
export default function Page() { return <LegalPage doc={terms} />; }
