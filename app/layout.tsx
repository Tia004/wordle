import type { Metadata } from "next";
import "./globals.css";
import KawaiiHeader from "@/components/KawaiiHeader";
import DecorativePanels from "@/components/DecorativePanels";

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
        <div style={{
          width: '100%',
          maxWidth: '1000px',
          background: 'var(--carrd-bg)',
          borderRadius: '16px',
          border: '4px solid var(--carrd-border)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none', // Strictly no shadows
          margin: '2rem'
        }}>
          {/* Decorative Top Dome inside wrapper */}
          <KawaiiHeader />

          <main style={{ flex: 1, padding: '2rem 1rem', display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start' }}>
            <DecorativePanels />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {children}
            </div>
          </main>

          <footer style={{
            textAlign: 'center',
            padding: '1rem',
            fontSize: '0.8rem',
            color: 'var(--carrd-border)',
            borderTop: '2px dashed var(--accent-pink)',
            background: 'var(--carrd-bg)',
            marginTop: 'auto'
          }}>
            by tia.carrd.co (Made with Carrd & Next.js)
          </footer>
        </div>
      </body>
    </html>
  );
}
