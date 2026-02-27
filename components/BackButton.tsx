"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const IconChevronLeft = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
    </svg>
);

export default function BackButton() {
    const pathname = usePathname();
    // Don't render on the homepage
    if (pathname === '/') return null;

    return (
        <Link
            href="/"
            style={{
                position: 'absolute',
                top: '0.6rem',
                left: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'white',
                border: '2px solid var(--carrd-border)',
                borderRadius: '20px',
                padding: '0.3rem 0.8rem',
                fontWeight: '800',
                fontSize: '0.85rem',
                color: 'var(--carrd-border)',
                textDecoration: 'none',
                zIndex: 10,
            }}
        >
            <IconChevronLeft />
        </Link>
    );
}
