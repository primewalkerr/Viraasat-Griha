import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Wishlist" };
export default function Page() {
  return <ComingSoon eyebrow="Wishlist" title="Save pieces you love" body="Your wishlist will open with the shop. You will be able to keep pieces here and come back to them later." />;
}
