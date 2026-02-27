"use client";

export default function GamePanel({ children }: { children: React.ReactNode }) {
    return (
        <div className="game-panel">
            <main className="game-main">
                {children}
            </main>
            <footer style={{
                flexShrink: 0,
                textAlign: 'center',
                padding: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: 'var(--carrd-border)',
                borderTop: '2px dashed var(--accent-pink)',
                background: 'var(--carrd-bg)',
            }}>
                By Tia
            </footer>
        </div>
    );
}
