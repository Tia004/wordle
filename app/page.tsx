import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '600px', width: '100%', marginTop: '2vh' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', color: 'var(--carrd-border)', textShadow: '2px 2px 0 white' }}>Ciao!</h2>
      <p style={{ marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '1.1rem', color: 'var(--foreground)', fontWeight: 'bold' }}>
        Indovina la parola in 6 tentativi. Accedi o registrati per tenere traccia dei tuoi progressi giornalieri.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/play" style={{
          background: 'var(--accent-pink)',
          color: 'white',
          padding: '1rem 2.5rem',
          borderRadius: '24px',
          border: '3px solid var(--carrd-border)',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          boxShadow: 'none',
          textDecoration: 'none'
        }}>
          Gioca Ora
        </Link>
      </div>
    </div>
  );
}
