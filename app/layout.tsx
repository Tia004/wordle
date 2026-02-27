import type { Metadata } from "next";
import "./globals.css";
import KawaiiHeader from "@/components/KawaiiHeader";

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
          maxWidth: '600px', // Thinner layout since no side panels
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
          <div style={{ flexShrink: 0 }}>
             <KawaiiHeader />
          </div>

          <main style={{ flex: 1, padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {children}
            </div>
          </main>

          <footer style={{
            textAlign: 'center',
            padding: '1rem',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: 'var(--carrd-border)',
            borderTop: '2px dashed var(--accent-pink)',
            background: 'var(--carrd-bg)',
            marginTop: 'auto'
          }}>
            By Tia
          </footer>
        </div>
      </body>
    </html>
  );
}
