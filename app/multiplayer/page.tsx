"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import CustomSelect from "@/components/CustomSelect";

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const IconHome = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
    </svg>
);
const IconLink = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);
const IconCheck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const IconCopy = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);
const IconBack = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

function ConfirmHomeModal({ onCancel }: { onCancel: () => void }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(168,129,125,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'var(--carrd-bg)', border: '4px solid var(--carrd-border)', borderRadius: '24px', padding: '1.5rem', textAlign: 'center', maxWidth: '260px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--carrd-border)' }}>Tornare alla home?</div>
                <div style={{ color: 'var(--foreground)', fontSize: '0.9rem' }}>Uscirai dalla stanza.</div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'nowrap' }}>
                    <a href="/" style={{ background: 'var(--primary)', border: '3px solid var(--carrd-border)', borderRadius: '20px', padding: '0.45rem 1.2rem', fontWeight: '800', color: 'var(--carrd-border)', textDecoration: 'none', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Sì</a>
                    <button onClick={onCancel} style={{ background: 'var(--absent)', border: '3px solid var(--carrd-border)', borderRadius: '20px', padding: '0.45rem 1.2rem', fontWeight: '800', color: 'var(--carrd-border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Annulla</button>
                </div>
            </div>
        </div>
    );
}

export default function MultiplayerLobby() {
    const { data: session } = useSession();
    const router = useRouter();
    const { socket, connected } = useSocket();

    const [mode, setMode] = useState<"menu" | "host" | "join">("menu");
    const [totalRounds, setTotalRounds] = useState(3);
    const [lang, setLang] = useState<"it" | "en">("it");
    const [joinCode, setJoinCode] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [roomId, setRoomId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showGoHome, setShowGoHome] = useState(false);

    // Ref so socket callbacks always see the latest roomId without stale closure
    const roomIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!socket) return;

        const onRoomCreated = ({ roomId: id }: { roomId: string }) => {
            roomIdRef.current = id;
            setRoomId(id);
        };

        const onPlayerJoined = () => {
            // Host has roomIdRef.current set; guest falls back to joinCode
            const target = roomIdRef.current ?? joinCode.trim().toUpperCase();
            if (target) router.push(`/multiplayer/${target}`);
        };

        const onError = ({ message }: { message: string }) => {
            setErrorMsg(message);
            setRoomId(null);
        };

        const onGuestLeft = () => {
            // Guest disconnected from waiting room — host stays, slot is now free
            setErrorMsg("L'avversario ha lasciato la stanza. In attesa di un nuovo giocatore…");
        };

        socket.on("room_created", onRoomCreated);
        socket.on("player_joined", onPlayerJoined);
        socket.on("error", onError);
        socket.on("guest_left", onGuestLeft);

        return () => {
            socket.off("room_created", onRoomCreated);
            socket.off("player_joined", onPlayerJoined);
            socket.off("error", onError);
            socket.off("guest_left", onGuestLeft);
        };
    }, [socket, router, joinCode]);

    const handleHost = () => {
        if (!session || !connected) return;
        setErrorMsg("");
        socket?.emit("create_room", {
            userName: session.user?.name ?? "Ospite",
            totalRounds,
            lang,
        });
    };

    const handleJoin = () => {
        if (!session || !connected) return;
        setErrorMsg("");
        socket?.emit("join_room", {
            roomId: joinCode.trim().toUpperCase(),
            userName: session.user?.name ?? "Ospite"
        });
    };

    const copyCode = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const btnStyle = (color = 'var(--accent-pink)'): React.CSSProperties => ({
        background: color,
        border: '3px solid var(--carrd-border)',
        borderRadius: '20px',
        padding: '0.6rem 1.6rem',
        fontWeight: 'bold',
        fontSize: '0.95rem',
        color: 'var(--carrd-border)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    });

    if (!session) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--carrd-border)', fontWeight: 'bold' }}>
            Devi essere loggato/a per giocare in 1vs1!
        </div>
    );

    // ── Waiting for guest (host view) ────────────────────────────────────────
    if (roomId) return (
        <div style={{ textAlign: 'center', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '340px' }}>
            {showGoHome && <ConfirmHomeModal onCancel={() => setShowGoHome(false)} />}
            <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--carrd-border)' }}>Stanza Creata!</div>
            <div style={{ color: 'var(--foreground)', fontSize: '0.9rem' }}>Codice da condividere con l'avversario:</div>
            <div style={{ background: 'var(--secondary)', padding: '1rem 2rem', borderRadius: '20px', border: '3px solid var(--carrd-border)', fontSize: '2.4rem', fontWeight: '900', letterSpacing: '0.5rem', color: 'var(--carrd-border)', fontFamily: 'monospace' }}>
                {roomId}
            </div>
            <button onClick={copyCode} style={btnStyle(copied ? 'var(--primary)' : 'white')}>
                {copied ? <IconCheck /> : <IconCopy />}
                {copied ? 'Copiato!' : 'Copia codice'}
            </button>
            {errorMsg
                ? <div style={{ color: '#e55', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>{errorMsg}</div>
                : <div style={{ color: 'var(--foreground)', fontSize: '0.85rem', fontStyle: 'italic' }}>In attesa che l'avversario si unisca…</div>
            }
            <button onClick={() => setShowGoHome(true)} style={{ ...btnStyle('white'), marginTop: '0.5rem' }}>
                <IconBack /> Home
            </button>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem', width: '100%', maxWidth: '400px' }}>
            {showGoHome && <ConfirmHomeModal onCancel={() => setShowGoHome(false)} />}

            <div style={{ fontWeight: '900', fontSize: '1.3rem', color: 'var(--carrd-border)' }}>Multiplayer 1v1</div>

            {mode === "menu" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <button style={btnStyle('var(--accent-pink)')} onClick={() => setMode("host")}>
                        <IconHome /> Crea Stanza
                    </button>
                    <button style={btnStyle('var(--accent-blue)')} onClick={() => setMode("join")}>
                        <IconLink /> Unisciti a una Stanza
                    </button>
                    <button style={btnStyle('white')} onClick={() => setShowGoHome(true)}>
                        <IconBack /> Home
                    </button>
                </div>
            )}

            {mode === "host" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <label style={{ fontWeight: 'bold', color: 'var(--carrd-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Numero di Round:
                        <CustomSelect 
                            value={totalRounds} 
                            onChange={(val) => setTotalRounds(Number(val))} 
                            options={[1, 2, 3, 5, 7].map(n => ({ value: n, label: String(n) }))} 
                        />
                    </label>
                    <label style={{ fontWeight: 'bold', color: 'var(--carrd-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Lingua:
                        <CustomSelect 
                            value={lang} 
                            onChange={(val) => setLang(val as "it" | "en")} 
                            options={[
                                { value: "it", label: "🇮🇹 Italiano" },
                                { value: "en", label: "🇬🇧 English" }
                            ]} 
                        />
                    </label>
                    <button style={btnStyle('var(--primary)')} onClick={handleHost} disabled={!connected}>
                        {connected
                            ? <><IconHome /> Crea e Aspetta</>
                            : <>Connessione al server…</>}
                    </button>
                    <button style={{ ...btnStyle('white') }} onClick={() => setMode("menu")}><IconBack /> Indietro</button>
                </div>
            )}

            {mode === "join" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <input
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        placeholder="Codice Stanza (6 lettere)"
                        style={{ padding: '0.6rem 1rem', borderRadius: '16px', border: '3px solid var(--carrd-border)', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.2rem', textAlign: 'center', color: 'var(--carrd-border)', outline: 'none' }}
                    />
                    {errorMsg && <div style={{ color: '#e55', fontWeight: 'bold', textAlign: 'center', fontSize: '0.9rem' }}>{errorMsg}</div>}
                    <button style={btnStyle('var(--secondary)')} onClick={handleJoin} disabled={joinCode.length < 6 || !connected}>
                        <IconCheck /> Unisciti
                    </button>
                    <button style={{ ...btnStyle('white') }} onClick={() => setMode("menu")}><IconBack /> Indietro</button>
                </div>
            )}
        </div>
    );
}
