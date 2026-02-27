"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
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
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Credenziali non valide.");
                setLoading(false);
                return;
            }

            router.replace("/play");
            router.refresh();
        } catch (error) {
            setError("Si è verificato un errore.");
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', width: '100%', padding: '2rem', marginTop: '10vh', background: 'var(--key-bg)', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--key-text)' }}>Accedi</h2>
            {error && (
                <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.8rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
                <button
                    disabled={loading}
                    type="submit"
                    style={{ background: 'var(--primary)', color: 'white', padding: '0.8rem', borderRadius: '4px', fontWeight: 'bold', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? "Accesso..." : "Accedi"}
                </button>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--key-text)' }}>
                Non hai un account? <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Registrati</Link>
            </p>
        </div>
    );
}
