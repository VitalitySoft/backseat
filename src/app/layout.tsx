import type { Metadata } from "next";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { getCurrentUser } from "@/lib/auth";
import type { NavUser } from "@/components/nav-types";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Backseat — Share Your Journey. Spread Kindness.",
  description:
    "A charity ride-sharing platform. Travelling alone? Offer your spare seat freely. If your companion wishes, they can donate any amount they choose to charity — never a fare, always their choice.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const navUser: NavUser | null = user
    ? {
        id: user.id,
        name: user.name,
        role: user.role as "USER" | "ADMIN",
        isRider: Boolean(user.riderProfile),
        isSharingActive: user.riderProfile?.isSharingActive ?? false,
      }
    : null;

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-text">
        <SiteHeader user={navUser} />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <SiteFooter />
        <MobileBottomNav user={navUser} />
        <ChatbotWidget />
      </body>
    </html>
  );
}
