import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LogoutButton from './LogoutButton';
import HeaderClientControls from './HeaderClientControls';
import HeaderPlayButton from './HeaderPlayButton';

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
                padding: 'var(--header-padding)',
                /* Cute striped background for the roof */
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.4) 20px, rgba(255,255,255,0.4) 40px)',
            }}>
                <Link href="/" style={{ display: 'flex', justifyContent: 'center' }}>
                    {/* Using standard img tag to bypass next/image caching of local replaced files */}
                    <img src="/logo.png" alt="Wordle Logo" style={{ display: 'block', maxWidth: 'var(--logo-width)', height: 'auto', objectFit: 'contain' }} />
                </Link>
            </div>

            {/* 2. The Navigation Banner */}
            <div style={{
                background: 'var(--secondary)',
                borderBottom: '4px solid var(--carrd-border)',
                padding: 'var(--nav-padding)',
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
                            <HeaderPlayButton />
                            <span style={{ fontSize: '1rem', fontWeight: '800' }}>Ciao, {session.user?.name}!</span>
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/login" style={{ background: 'white', color: 'var(--carrd-border)', border: '3px solid var(--carrd-border)', padding: '0.4rem 1.2rem', borderRadius: '20px', fontWeight: '800', fontSize: '0.9rem', textDecoration: 'none' }}>Login</Link>
                            <Link href="/register" style={{ background: 'var(--accent-pink)', color: 'white', border: '3px solid var(--carrd-border)', padding: '0.4rem 1.2rem', borderRadius: '20px', fontWeight: '800', fontSize: '0.9rem', textDecoration: 'none' }}>Register</Link>
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
