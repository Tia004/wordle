"use client";
import { usePathname } from 'next/navigation';

export default function HeaderPlayButton() {
    const pathname = usePathname();

    // Show only when on the play page (in game)
    if (pathname !== '/play') {
        return null;
    }

    return (
        <a href="/play" style={{ 
            background: 'white', 
            border: '2px solid var(--carrd-border)', 
            padding: '0.4rem 1rem', 
            borderRadius: '12px', 
            color: 'var(--carrd-border)', 
            textDecoration: 'none',
            fontWeight: 'bold'
        }}>
            Nuova partita
        </a>
    );
}
