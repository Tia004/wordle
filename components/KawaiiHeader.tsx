import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LogoutButton from './LogoutButton';
import HeaderClientControls from './HeaderClientControls';

export default async function KawaiiHeader() {
    const session = await getServerSession(authOptions);

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* 1. The Pastel Striped Dome Roof */}
            <div style={{
                width: '100%',
                backgroundColor: 'var(--carrd-header-bg)',
                borderBottom: '4px solid var(--carrd-border)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem 1rem',
                /* Cute striped background for the roof */
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.4) 20px, rgba(255,255,255,0.4) 40px)',
            }}>
                {/* Scalloped top border inside the container (optional, but requested layout is dome-like) */}

                {/* The requested Logo */}
                <Link href="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1346 648"
                        width="250px"
                        height="auto"
                        style={{ display: 'block' }}
                    >
                        <text kerning="auto" fontFamily="Quicksand, sans-serif" fontWeight="bold" fill="var(--carrd-border)" transform="matrix( 17.5619354433302, -4.00625112990956, 4.00625112990957, 17.5619354433302,1016.71533563507, 685.373456994531)" fontSize="50px">
                            <tspan fontSize="50px" fill="var(--secondary)">&#63;</tspan>
                        </text>
                        <text kerning="auto" fontFamily="Quicksand, sans-serif" fontWeight="bold" fill="var(--carrd-border)" transform="matrix( 7.55389590738482, 0, 0, 7.55389590738482,0.6293818516375, 497.300970194004)" fontSize="50px">
                            <tspan fontSize="50px" fill="white" stroke="var(--carrd-border)" strokeWidth="2px">KAWAII WORDLE</tspan>
                        </text>
                    </svg>
                </Link>

                {/* Kaomoji decor */}
                <div style={{
                    fontSize: '1.2rem',
                    color: 'var(--carrd-border)',
                    fontWeight: 'bold',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                }}>
                    <span>(っ^‿^)っ</span>
                    <span>✉️</span>
                    <span>🌸</span>
                </div>
            </div>

            {/* 2. The Banner with "comms: OPEN!" */}
            <div style={{
                background: 'var(--secondary)',
                borderBottom: '4px solid var(--carrd-border)',
                padding: '0.5rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold',
                color: 'var(--carrd-border)',
                fontSize: '0.9rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '2px solid var(--carrd-border)' }}>
                        comms: OPEN!
                    </span>
                    <span>꒰ ू•ૅω•́꒱ᵎᵎᵎ</span>
                </div>

                <nav style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    {session ? (
                        <>
                            <HeaderClientControls />
                            <Link href="/play" style={{ background: 'white', border: '2px solid var(--carrd-border)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>play!</Link>
                            <span>Hi, {session.user?.name} 🎀</span>
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/login" style={{ background: 'white', border: '2px solid var(--carrd-border)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>login!</Link>
                            <Link href="/register" style={{ background: 'var(--accent-pink)', color: 'white', border: '2px solid var(--carrd-border)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>sign up ♡</Link>
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
