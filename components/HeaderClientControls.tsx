"use client";

import { useState } from "react";
import StatsModal from "./StatsModal";

export default function HeaderClientControls() {
    const [showStats, setShowStats] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowStats(true)}
                style={{
                    background: 'white',
                    border: '2px solid var(--carrd-border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.4rem 0.8rem',
                }}
                title="Statistiche"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--carrd-border)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            </button>
            {showStats && <StatsModal onClose={() => setShowStats(false)} />}
        </>
    );
}
