import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LogoutButton from './LogoutButton';
import HeaderClientControls from './HeaderClientControls';

export default async function KawaiiHeader() {
    const session = await getServerSession(authOptions);

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

            <div style={{
                width: '100%',
                backgroundColor: 'var(--carrd-header-bg)',
                borderBottom: '4px solid var(--carrd-border)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 1rem', // Increased padding to make room for a bigger logo
                /* Cute striped background for the roof */
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.4) 20px, rgba(255,255,255,0.4) 40px)',
            }}>
                <Link href="/" style={{ display: 'flex', justifyContent: 'center' }}>
                    {/* Using standard img tag to bypass next/image caching of local replaced files */}
                    <img src="/logo.png" alt="Wordle Logo" style={{ display: 'block', maxWidth: '300px', height: 'auto', objectFit: 'contain' }} />
                </Link>
            </div>

            {/* 2. The Navigation Banner */}
            <div style={{
                background: 'var(--secondary)',
                borderBottom: '4px solid var(--carrd-border)',
                padding: '0.8rem 1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 'bold',
                color: 'var(--carrd-border)',
                fontSize: '0.9rem'
            }}>
                <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {session ? (
                        <>
                            <HeaderClientControls />
                            <Link href="/play" style={{ background: 'white', border: '2px solid var(--carrd-border)', padding: '0.4rem 1rem', borderRadius: '12px' }}>Play</Link>
                            <span>Hi, {session.user?.name}</span>
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/login" style={{ background: 'white', border: '2px solid var(--carrd-border)', padding: '0.4rem 1rem', borderRadius: '12px' }}>Login</Link>
                            <Link href="/register" style={{ background: 'var(--accent-pink)', color: 'white', border: '2px solid var(--carrd-border)', padding: '0.4rem 1rem', borderRadius: '12px' }}>Register</Link>
                        </>
                    )}
                </nav>
            </div>

            {/* 3. Scalloped Lace Divider */}
            <div style={{
                width: '100%',
                height: '24px',
                borderBottom: '2px dashed var(--accent-pink)',
                backgroundImage: 'radial-gradient(circle at 12px 0, transparent 12px, var(--carrd-bg) 13px)',
                backgroundSize: '24px 100%',
                backgroundPosition: '0 0',
                transform: 'rotate(180deg)' // Points the scallops downwards
            }}></div>

        </div>
    );
}
