"use client";
import React, { useState, useEffect } from 'react';

export default function LoadingScreen() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    if (!isLoading) return null;

    return (
        <div style={{ 
            position: 'fixed',
            inset: 0,
            background: 'var(--carrd-bg)',
            zIndex: 99999,
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100vw', 
            height: '100vh',
            padding: '2rem 1rem' 
        }}>
            <style>{`
                @keyframes kawaiiFill {
                    0% { background-color: transparent; transform: scale(1); }
                    10% { background-color: var(--carrd-border); transform: scale(1.1); }
                    95% { background-color: var(--carrd-border); transform: scale(1); }
                    100% { background-color: transparent; transform: scale(1); }
                }
                @keyframes kawaiiPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.98); }
                }
            `}</style>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '2rem' }}>
                {Array.from({ length: 6 }).map((_, r) => (
                    <div key={r} style={{ display: 'flex', gap: '8px' }}>
                        {Array.from({ length: 5 }).map((_, c) => {
                            const i = r * 5 + c;
                            return (
                                <div key={c} style={{
                                    width: '3.5rem',
                                    height: '3.5rem',
                                    border: '3px solid var(--carrd-border)',
                                    borderRadius: '16px',
                                    animation: 'kawaiiFill 1.2s infinite ease-in-out',
                                    animationDelay: `${i * (1200 / 30)}ms`
                                }} />
                            );
                        })}
                    </div>
                ))}
            </div>
            
            <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '900', 
                color: 'var(--carrd-border)', 
                textShadow: '2px 2px 0px white', 
                letterSpacing: '2px', 
                animation: 'kawaiiPulse 1.5s infinite ease-in-out',
                margin: 0
            }}>
                Caricamento...
            </h3>
        </div>
    );
}
