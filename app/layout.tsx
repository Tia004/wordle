import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import LoadingScreen from "@/components/LoadingScreen";
import SidebarPanel from "@/components/SidebarPanel";
import GamePanel from "@/components/GamePanel";

export const metadata: Metadata = {
  title: "Kawaii Wordle",
  description: "A super cute flat Wordle clone!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <LoadingScreen />
          {/* Outer wrapper — row on desktop, column on mobile */}
          <div className="app-shell">
            {/* LEFT: Striped logo panel */}
            <SidebarPanel />
            {/* RIGHT: Game content card */}
            <GamePanel>{children}</GamePanel>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
