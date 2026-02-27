import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '600px', width: '100%', marginTop: '5vh' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800' }}>Wordle Clone</h2>
      <p style={{ marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '1.1rem', color: 'var(--foreground)', opacity: 0.9 }}>
        Indovina la parola in 6 tentativi. Accedi o registrati per tenere traccia dei tuoi progressi,
        statistiche e la serie di vittorie consecutive.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href="/play" style={{
          background: 'var(--primary)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transition: 'background 0.2s'
        }}>
          Gioca Ora
        </Link>
      </div>
    </div>
  );
}
