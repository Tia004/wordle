"use client";
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconSolo = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
);
const IconSwords = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
        <line x1="13" y1="19" x2="19" y2="13"/>
        <line x1="16" y1="16" x2="20" y2="20"/>
        <line x1="19" y1="21" x2="21" y2="19"/>
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/>
        <line x1="5" y1="14" x2="9" y2="18"/>
        <line x1="7" y1="21" x2="3" y2="17"/>
    </svg>
);
const IconCheck = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);
const IconX = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

export default function HeaderPlayButton() {
    const pathname = usePathname();
    const router = useRouter();
    const [showPicker, setShowPicker] = useState(false);
    const [pending, setPending] = useState<'/play' | '/multiplayer' | null>(null);

    // Only show when a game is in progress (/play)
    if (pathname !== '/play') return null;

    const pick = (dest: '/play' | '/multiplayer') => {
        setPending(dest);
        setShowPicker(false);
    };

    const confirm = () => {
        if (pending) router.push(pending);
        setPending(null);
    };

    const btnStyle: React.CSSProperties = {
        background: 'white',
        color: 'var(--carrd-border)',
        border: '3px solid var(--carrd-border)',
        padding: '0.4rem 1.1rem',
        borderRadius: '20px',
        fontWeight: '800',
        fontSize: '0.9rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
    };

    const cardStyle = (bg: string): React.CSSProperties => ({
        background: bg,
        border: '3px solid var(--carrd-border)',
        borderRadius: '20px',
        padding: '0.7rem 1rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: '800',
        color: 'var(--carrd-border)',
        fontSize: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.3rem',
    });

    const overlayStyle: React.CSSProperties = {
        position: 'fixed', inset: 0,
        background: 'rgba(168,129,125,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    };
    const modalStyle: React.CSSProperties = {
        background: 'var(--carrd-bg)',
        border: '4px solid var(--carrd-border)',
        borderRadius: '24px',
        padding: '1.5rem',
        textAlign: 'center',
        maxWidth: '280px',
        width: '90%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'center',
    };

    return (
        <>
            <button style={btnStyle} onClick={() => setShowPicker(true)}>
                Nuova partita
            </button>

            {/* Step 1 — Mode picker */}
            {showPicker && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--carrd-border)' }}>Scegli modalità</div>
                        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                            <button style={cardStyle('var(--accent-pink)')} onClick={() => pick('/play')}>
                                <IconSolo /><span>Singleplayer</span>
                            </button>
                            <button style={cardStyle('var(--accent-blue)')} onClick={() => pick('/multiplayer')}>
                                <IconSwords /><span>1v1</span>
                            </button>
                        </div>
                        <button onClick={() => setShowPicker(false)} style={{ ...btnStyle, fontSize: '0.8rem', padding: '0.3rem 1rem', justifyContent: 'center' }}>
                            <IconX /> Annulla
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2 — Confirm (buttons forced to single row) */}
            {pending && (
                <div style={{ ...overlayStyle, zIndex: 1001 }}>
                    <div style={{ ...modalStyle, maxWidth: '260px' }}>
                        {pending === '/play' ? <IconSolo /> : <IconSwords />}
                        <div style={{ color: 'var(--foreground)', fontWeight: '600', fontSize: '0.95rem' }}>Confermi la scelta?</div>
                        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'nowrap' }}>
                            <button onClick={confirm} style={{ ...btnStyle, background: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                <IconCheck /> Sì
                            </button>
                            <button onClick={() => setPending(null)} style={{ ...btnStyle, background: 'var(--absent)', whiteSpace: 'nowrap' }}>
                                <IconX /> No
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
