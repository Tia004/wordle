"use client";

import { useEffect, useState } from "react";

type StatsType = {
    played: number;
    wins: number;
    currentStreak: number;
    maxStreak: number;
    winDistribution: string;
};

export default function StatsModal({ onClose }: { onClose: () => void }) {
    const [stats, setStats] = useState<StatsType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (!data || data.message === "Non autorizzato") {
                    setStats({ played: 0, wins: 0, currentStreak: 0, maxStreak: 0, winDistribution: "{}" });
                } else {
                    setStats(data);
                }
            })
            .catch(() => setStats({ played: 0, wins: 0, currentStreak: 0, maxStreak: 0, winDistribution: "{}" }))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;

    const dist = JSON.parse(stats?.winDistribution || '{}');
    const winPercent = stats?.played ? Math.round((stats.wins / stats.played) * 100) : 0;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255, 237, 243, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)'
        }}>
            <div style={{ background: 'var(--carrd-bg)', color: 'var(--carrd-border)', padding: '2rem', borderRadius: '16px', border: '4px solid var(--carrd-border)', maxWidth: '400px', width: '90%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--accent-pink)', border: '2px solid var(--carrd-border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>✕</button>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'var(--accent-green)', padding: '0.4rem 1.5rem', borderRadius: '20px', border: '2px solid var(--carrd-border)', display: 'inline-block' }}>Statistiche</h2>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '2rem', textAlign: 'center', width: '100%' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.played || 0}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Giocate</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{winPercent}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>% Vittorie</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.currentStreak || 0}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Serie Attuale</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.maxStreak || 0}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Record Serie</div>
                    </div>
                </div>

                <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Distribuzione Tentativi</h3>
                <div style={{ width: '100%' }}>
                    {[1, 2, 3, 4, 5, 6].map(num => {
                        const count = dist[num] || 0;
                        const maxCount = Math.max(...Object.values(dist) as number[], 1);
                        const width = Math.max((count / maxCount) * 100, 8); // slightly increased min width

                        return (
                            <div key={num} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.6rem', fontSize: '1rem', fontWeight: 'bold' }}>
                                <div style={{ width: '24px' }}>{num}</div>
                                <div style={{ flex: 1, background: 'var(--carrd-bg)', borderRadius: '12px', overflow: 'hidden', border: '3px solid #b8a5a6', height: '28px' }}>
                                    <div style={{
                                        height: '100%',
                                        background: count > 0 ? '#b8a5a6' : '#d2ced3', // specific colors from mockup
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start', // Zeros/numbers left-aligned 
                                        paddingLeft: '0.6rem',
                                        width: `${width}%`,
                                        borderRadius: '8px'
                                    }}>
                                        {count}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
