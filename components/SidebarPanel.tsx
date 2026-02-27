import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LogoutButton from './LogoutButton';
import HeaderClientControls from './HeaderClientControls';
import HeaderPlayButton from './HeaderPlayButton';

export default async function SidebarPanel() {
    const session = await getServerSession(authOptions);

    return (
        <aside className="sidebar-panel">
            {/* Striped dome area with logo */}
            <div className="sidebar-dome">
                <Link href="/" style={{ display: 'flex', justifyContent: 'center' }}>
                    <img
                        src="/logo.png"
                        alt="Kawaii Wordle Logo"
                        style={{ maxWidth: 'var(--logo-width)', width: '100%', height: 'auto', objectFit: 'contain' }}
                    />
                </Link>
            </div>

            {/* Nav bar inside sidebar */}
            <div className="sidebar-nav">
                <nav style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {session ? (
                        <>
                            <HeaderClientControls />
                            <HeaderPlayButton />
                            <span className="hide-mobile" style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--carrd-border)' }}>Ciao, {session.user?.name}!</span>
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/login" style={{ background: 'white', color: 'var(--carrd-border)', border: '3px solid var(--carrd-border)', padding: '0.35rem 1rem', borderRadius: '20px', fontWeight: '800', fontSize: '0.85rem', textDecoration: 'none' }}>Login</Link>
                            <Link href="/register" style={{ background: 'var(--accent-pink)', color: 'white', border: '3px solid var(--carrd-border)', padding: '0.35rem 1rem', borderRadius: '20px', fontWeight: '800', fontSize: '0.85rem', textDecoration: 'none' }}>Register</Link>
                        </>
                    )}
                </nav>
            </div>

            {/* Info blurb — only visible on desktop left panel */}
            <div className="sidebar-info">
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', fontWeight: '600', lineHeight: 1.6 }}>
                    Indovina la parola in 6 tentativi!
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--foreground)', lineHeight: 1.5, marginTop: '0.4rem' }}>
                    Verde = lettera giusta al posto giusto<br/>
                    Giallo = lettera presente ma fuori posto<br/>
                    Grigio = lettera assente
                </p>
            </div>

            {/* Scalloped lace bottom divider (visible mobile as bottom border of panel) */}
            <div className="sidebar-lace" />
        </aside>
    );
}
