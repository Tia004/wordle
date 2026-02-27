import type { Metadata } from "next";
import "./globals.css";
import KawaiiHeader from "@/components/KawaiiHeader";

export const metadata: Metadata = {
  title: "Kawaii Wordle",
  description: "A super cute flat Wordle clone!",
};

import LoadingScreen from "@/components/LoadingScreen";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LoadingScreen />
        <div style={{
          width: '100%',
          maxWidth: '600px', 
          height: '100%',
          maxHeight: '100vh',
          background: 'var(--carrd-bg)',
          borderRadius: '16px',
          border: '4px solid var(--carrd-border)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none', 
          margin: '0 auto',
          overflow: 'hidden'
        }}>
          {/* Decorative Top Dome inside wrapper */}
          <div style={{ flexShrink: 0 }}>
             <KawaiiHeader />
          </div>

          <main style={{ flex: 1, padding: 'var(--main-padding, 1rem)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              {children}
            </div>
          </main>

          <footer style={{
            flexShrink: 0,
            textAlign: 'center',
            padding: '0.8rem',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: 'var(--carrd-border)',
            borderTop: '2px dashed var(--accent-pink)',
            background: 'var(--carrd-bg)'
          }}>
            By Tia
          </footer>
        </div>
      </body>
    </html>
  );
}
