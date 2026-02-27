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
            color: 'var(--carrd-border)', 
            border: '3px solid var(--carrd-border)', 
            padding: '0.4rem 1.2rem', 
            borderRadius: '20px', 
            fontWeight: '800', 
            fontSize: '0.9rem', 
            textDecoration: 'none'
        }}>
            Nuova partita
        </a>
    );
}
