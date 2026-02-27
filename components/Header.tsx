import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LogoutButton from './LogoutButton';
import HeaderClientControls from './HeaderClientControls';

export default async function Header() {
    const session = await getServerSession(authOptions);

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            width: '100%'
        }}>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                    <Image src="/logo.png" alt="Wordle Logo" width={120} height={40} style={{ display: 'block' }} />
                </Link>
            </h1>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {session ? (
                    <>
                        <HeaderClientControls />
                        <Link href="/play" style={{ fontWeight: 'bold', color: 'var(--foreground)', textDecoration: 'underline' }}>Gioca</Link>
                        <span style={{ fontWeight: 'bold' }}>{session.user?.name}</span>
                        <LogoutButton />
                    </>
                ) : (
                    <>
                        <Link href="/login">Login</Link>
                        <Link href="/register" style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px' }}>Registrati</Link>
                    </>
                )}
            </nav>
        </header>
    );
}
