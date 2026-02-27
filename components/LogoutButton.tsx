"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{ background: 'white', color: 'var(--carrd-border)', border: '3px solid var(--carrd-border)', padding: '0.4rem 1.2rem', borderRadius: '20px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Esci
        </button>
    );
}
