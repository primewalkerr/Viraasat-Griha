import type { Metadata } from "next";
import { Cormorant_Garamond, Public_Sans, Tiro_Devanagari_Hindi } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { config } from "@/lib/config";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const body = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const hindi = Tiro_Devanagari_Hindi({ subsets: ["devanagari", "latin"], weight: "400", variable: "--font-hindi", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Viraasat Griha · A Home for Indian Art & Heritage", template: "%s · Viraasat Griha" },
  description: "Explore India's crafts by the city they come from: read the story, watch the work being made, and find the shops that sell it.",
  robots: config.preview ? { index: false, follow: false } : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hindi.variable}`}>
      <body>
        {config.preview && (
          <div className="preview-bar" role="status">
            Preview: drafts, unchecked text and media without permission are shown and labelled. Set VG_PREVIEW=0 for the live view.
          </div>
        )}
        <div className="page">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
