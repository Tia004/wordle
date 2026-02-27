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
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
            <div style={{ background: 'var(--background)', color: 'var(--foreground)', padding: '2rem', borderRadius: '8px', maxWidth: '400px', width: '90%', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--foreground)' }}>×</button>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Statistiche</h2>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '2rem', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.played || 0}</div>
                        <div style={{ fontSize: '0.8rem' }}>Giocate</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{winPercent}</div>
                        <div style={{ fontSize: '0.8rem' }}>% Vittorie</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.currentStreak || 0}</div>
                        <div style={{ fontSize: '0.8rem' }}>Serie Attuale</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.maxStreak || 0}</div>
                        <div style={{ fontSize: '0.8rem' }}>Record Serie</div>
                    </div>
                </div>

                <h3 style={{ marginBottom: '1rem' }}>Distribuzione Tentativi</h3>
                {[1, 2, 3, 4, 5, 6].map(num => {
                    const count = dist[num] || 0;
                    const maxCount = Math.max(...Object.values(dist) as number[], 1);
                    const width = Math.max((count / maxCount) * 100, 5);

                    return (
                        <div key={num} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <div style={{ width: '20px' }}>{num}</div>
                            <div style={{ flex: 1, background: 'var(--key-bg)' }}>
                                <div style={{ background: count > 0 ? 'var(--primary)' : 'var(--absent)', color: 'white', padding: '0.1rem 0.5rem', textAlign: 'right', width: `${width}%` }}>
                                    {count}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
