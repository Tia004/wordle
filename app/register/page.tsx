"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Errore durante la registrazione");
            }

            // Autologin after registration
            const signInRes = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (signInRes?.error) {
                throw new Error("Errore durante l'accesso automatico");
            }

            router.replace("/play");
            router.refresh();
        } catch (error: any) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', marginTop: '1rem', background: 'var(--carrd-bg)', borderRadius: '16px', border: '3px solid var(--carrd-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--carrd-border)', background: 'var(--accent-pink)', padding: '0.4rem 1.5rem', borderRadius: '20px', border: '2px solid var(--carrd-border)', display: 'inline-block' }}>Registrati</h2>
            {error && (
                <div style={{ background: '#ffe4e1', color: '#c9302c', padding: '0.8rem', borderRadius: '12px', border: '2px dashed #c9302c', marginBottom: '1rem', width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                <input
                    type="text"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ padding: '1rem', borderRadius: '12px', border: '2px solid var(--carrd-border)', background: 'white', color: 'var(--carrd-border)', fontWeight: 'bold', outline: 'none' }}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '1rem', borderRadius: '12px', border: '2px solid var(--carrd-border)', background: 'white', color: 'var(--carrd-border)', fontWeight: 'bold', outline: 'none' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '1rem', borderRadius: '12px', border: '2px solid var(--carrd-border)', background: 'white', color: 'var(--carrd-border)', fontWeight: 'bold', outline: 'none' }}
                />
                <button
                    disabled={loading}
                    type="submit"
                    style={{ background: 'var(--accent-green)', color: 'var(--carrd-border)', padding: '1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', border: '2px solid var(--carrd-border)', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}>
                    {loading ? "Registrazione..." : "Registrati"}
                </button>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 'bold' }}>
                Hai già un account? <Link href="/login" style={{ color: 'var(--accent-pink)', textDecoration: 'underline' }}>Accedi</Link>
            </p>
        </div>
    );
}
