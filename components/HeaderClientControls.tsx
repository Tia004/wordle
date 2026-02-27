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
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    padding: '0 0.5rem',
                    color: 'var(--foreground)'
                }}
                title="Statistiche"
            >
                📊
            </button>
            {showStats && <StatsModal onClose={() => setShowStats(false)} />}
        </>
    );
}
