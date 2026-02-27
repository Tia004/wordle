"use client";

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState } from 'react';

const IconSolo = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
);
const IconSwords = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/>
        <line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/>
        <line x1="7" y1="21" x2="3" y2="17"/>
    </svg>
);
const IconFlame = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.5-1.5-3-1.5-5 0 3-4 3-3.5 5Z"/>
        <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/>
    </svg>
);

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const { socket, connected } = useSocket();
  const [activeRoom, setActiveRoom] = useState<{roomId: string, mode: string} | null>(null);

  useEffect(() => {
    if (!socket || !connected || !session?.user?.name) return;
    
    socket.emit('check_active_room', { userName: session.user.name });
    
    const onActiveRoomFound = (res: { roomId: string, mode: string }) => {
      setActiveRoom(res);
    };
    
    socket.on('active_room_found', onActiveRoomFound);
    return () => {
      socket.off('active_room_found', onActiveRoomFound);
    };
  }, [socket, connected, session]);

  const cardStyle = (accent: string): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
    background: accent, border: '3px solid var(--carrd-border)', borderRadius: '20px',
    padding: '1rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit',
    fontWeight: '800', fontSize: '0.9rem', color: 'var(--carrd-border)', flex: 1,
  });

  return (
    <div style={{ textAlign: 'center', padding: '1.2rem', maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {activeRoom && (
        <div 
          onClick={() => router.push(activeRoom.mode === 'battle' ? `/battle/${activeRoom.roomId}` : `/multiplayer/${activeRoom.roomId}`)}
          style={{ width: '100%', maxWidth: '380px', background: 'var(--primary)', border: '3px solid var(--carrd-border)', borderRadius: '16px', padding: '0.8rem 1rem', marginBottom: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 0 var(--carrd-border)', transform: 'translateY(0)', transition: 'transform 0.1s, box-shadow 0.1s' }}
          onPointerDown={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = 'none'; }}
          onPointerUp={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 var(--carrd-border)'; }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 var(--carrd-border)'; }}
        >
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '900', color: 'var(--carrd-border)', fontSize: '0.95rem' }}>Hai una partita in corso!</div>
            <div style={{ fontWeight: '700', color: 'var(--carrd-border)', fontSize: '0.8rem', opacity: 0.9 }}>
              Clicca qui per rientrare nella Stanza: {activeRoom.roomId}
            </div>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: '800', color: 'var(--carrd-border)', textShadow: '2px 2px 0 white' }}>
        Ciao!
      </h2>

      {!session && (
        <p style={{ marginBottom: '1.4rem', lineHeight: '1.6', fontSize: '0.95rem', color: 'var(--foreground)', fontWeight: 'bold' }}>
          Indovina la parola in 6 tentativi. Accedi o registrati per tenere traccia dei tuoi progressi.
        </p>
      )}
      {session && (
        <p style={{ marginBottom: '1.4rem', lineHeight: '1.4', fontSize: '0.95rem', color: 'var(--foreground)', fontWeight: 'bold' }}>
          Scegli la modalità di gioco!
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'center' }}>
        <button style={cardStyle('var(--accent-pink)')} onClick={() => router.push('/play')}>
          <IconSolo />
          <span>Singleplayer</span>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--foreground)' }}>VS dizionario</span>
        </button>

        <button style={cardStyle('var(--accent-blue)')} onClick={() => router.push('/multiplayer')}>
          <IconSwords />
          <span>Sfida 1v1</span>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--foreground)' }}>VS avversario</span>
        </button>

        <button style={cardStyle('var(--secondary)')} onClick={() => router.push('/battle')}>
          <IconFlame />
          <span>Battaglia</span>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--foreground)' }}>2-4 giocatori</span>
        </button>
      </div>
    </div>
  );
}
