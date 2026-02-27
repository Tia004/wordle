"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import CustomSelect from "@/components/CustomSelect";

const IconSwords = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/>
        <line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/>
        <line x1="7" y1="21" x2="3" y2="17"/>
    </svg>
);
const IconCopy = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
);
const IconCheck = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);
const IconBack = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
    </svg>
);

type Player = { id: string; name: string; score: number };

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

export default function BattleLobby() {
    const { data: session } = useSession();
    const router = useRouter();
    const { socket, connected } = useSocket();

    const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
    const [totalRounds, setTotalRounds] = useState(3);
    const [lang, setLang] = useState<"it" | "en">("it");
    const [joinCode, setJoinCode] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [roomId, setRoomId] = useState<string | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [copied, setCopied] = useState(false);
    const [hostId, setHostId] = useState<string | null>(null);
    const [showGoHome, setShowGoHome] = useState(false);

    // Ref so socket callbacks always see the latest roomId (avoids stale closures)
    const roomIdRef = useRef<string | null>(null);
    const setRoomIdSynced = (id: string | null) => {
        roomIdRef.current = id;
        setRoomId(id);
    };


    useEffect(() => {
        if (!socket) return;

        const onCreated = ({ roomId: id }: { roomId: string }) => {
            setRoomIdSynced(id);
            setIsHost(true);
            setHostId(socket.id ?? null);
        };
        const onPlayerJoined = ({ players: ps, hostId: hid, roomId: rid }: any) => {
            setPlayers(ps);
            setHostId(hid);
            // Guest: server confirms the join — now set roomId to show waiting room
            if (!roomIdRef.current && rid) {
                setRoomIdSynced(rid);
            }
        };
        const onError = ({ message }: { message: string }) => {
            setErrorMsg(message);
            // Reset roomId so guest can retry with a different code
            setRoomIdSynced(null);
        };
        const onRoundStart = (_data: any) => {
            // Use ref to avoid stale closure — roomId in deps might lag
            if (roomIdRef.current) router.push(`/battle/${roomIdRef.current}`);
        };

        socket.on("battle_created", onCreated);
        socket.on("battle_player_joined", onPlayerJoined);
        socket.on("error", onError);
        socket.on("battle_round_start", onRoundStart);

        return () => {
            socket.off("battle_created", onCreated);
            socket.off("battle_player_joined", onPlayerJoined);
            socket.off("error", onError);
            socket.off("battle_round_start", onRoundStart);
        };
    }, [socket, router]);

    const handleCreate = () => {
        if (!session || !connected) return;
        socket?.emit("create_battle", {
            userName: session.user?.name ?? "Ospite",
            totalRounds,
            lang,
        });
    };

    const handleJoin = () => {
        if (!session || !connected) return;
        setErrorMsg("");
        socket?.emit("join_battle", {
            roomId: joinCode.trim().toUpperCase(),
            userName: session.user?.name ?? "Ospite",
        });
        // Don't set roomId here — wait for server confirmation via battle_player_joined
        // so that a rejected join correctly shows the error and allows retry
    };

    const handleStart = () => {
        socket?.emit("start_battle");
    };

    const copyCode = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const btn = (bg: string): React.CSSProperties => ({
        background: bg, border: '3px solid var(--carrd-border)', borderRadius: '20px',
        padding: '0.6rem 1.4rem', fontWeight: 'bold', fontSize: '0.9rem',
        color: 'var(--carrd-border)', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
    });

    if (!session) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--carrd-border)', fontWeight: 'bold' }}>
            Devi essere loggato/a per giocare in Battle Royale!
        </div>
    );

    // ── Waiting room ─────────────────────────────────────────────────────────
    if (roomId) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem', width: '100%', maxWidth: '380px' }}>
            {showGoHome && <ConfirmHomeModal onCancel={() => setShowGoHome(false)} />}


            <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--carrd-border)' }}>Sala d'Attesa</div>

            <div style={{ color: 'var(--foreground)', fontSize: '0.9rem' }}>Codice stanza:</div>
            <div style={{ background: 'var(--secondary)', padding: '0.8rem 2rem', borderRadius: '20px', border: '3px solid var(--carrd-border)', fontSize: '2rem', fontWeight: '900', letterSpacing: '0.4rem', color: 'var(--carrd-border)', fontFamily: 'monospace' }}>
                {roomId}
            </div>
            <button onClick={copyCode} style={btn(copied ? 'var(--primary)' : 'white')}>
                {copied ? <IconCheck /> : <IconCopy />}
                {copied ? 'Copiato!' : 'Copia codice'}
            </button>

            <div style={{ width: '100%', border: '3px solid var(--carrd-border)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--accent-pink)', borderBottom: '2px solid var(--carrd-border)', padding: '0.4rem 0.8rem', fontWeight: '800', color: 'var(--carrd-border)', fontSize: '0.85rem' }}>
                    Giocatori ({players.length}/4)
                </div>
                {players.map((p, i) => (
                    <div key={p.id} style={{ padding: '0.5rem 0.8rem', borderBottom: i < players.length - 1 ? '1px solid var(--absent)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--carrd-border)', fontSize: '0.9rem' }}>
                        {p.id === hostId && <span style={{ background: 'var(--secondary)', borderRadius: '8px', padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>HOST</span>}
                        {p.name}
                    </div>
                ))}
                {players.length < 4 && (
                    <div style={{ padding: '0.5rem 0.8rem', color: 'var(--absent)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        In attesa... ({4 - players.length} posti liberi)
                    </div>
                )}
            </div>

            {isHost && players.length >= 2 && (
                <button onClick={handleStart} style={{ ...btn('var(--primary)'), fontWeight: '900', fontSize: '1rem' }}>
                    <IconSwords /> Inizia la Battaglia!
                </button>
            )}
            {isHost && players.length < 2 && (
                <div style={{ color: 'var(--foreground)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Aspetta almeno un altro giocatore...
                </div>
            )}
            {!isHost && (
                <div style={{ color: 'var(--foreground)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    In attesa che l'host avvii la partita...
                </div>
            )}
            <button onClick={() => setShowGoHome(true)} style={{ ...btn('white'), marginTop: '0.5rem' }}>
                <IconBack /> Home
            </button>
        </div>
    );

    // ── Menu / Create / Join ──────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', padding: '1rem 0', width: '100%', maxWidth: '380px' }}>
            {showGoHome && <ConfirmHomeModal onCancel={() => setShowGoHome(false)} />}


            <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--carrd-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconSwords /> Battaglia Reale
            </div>

            {mode === "menu" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <button style={btn('var(--accent-pink)')} onClick={() => setMode("create")}>Crea Stanza</button>
                    <button style={btn('var(--accent-blue)')} onClick={() => setMode("join")}>Unisciti</button>
                    <button style={btn('white')} onClick={() => setShowGoHome(true)}><IconBack /> Home</button>
                </div>
            )}

            {mode === "create" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <label style={{ fontWeight: 'bold', color: 'var(--carrd-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Round:
                        <CustomSelect 
                            value={totalRounds} 
                            onChange={(val) => setTotalRounds(Number(val))} 
                            options={[1, 3, 5, 7].map(n => ({ value: n, label: String(n) }))} 
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
                    <button style={btn('var(--primary)')} onClick={handleCreate} disabled={!connected}>
                        {connected ? 'Crea e Aspetta' : 'Connessione...'}
                    </button>
                    <button style={btn('white')} onClick={() => setMode("menu")}><IconBack /> Indietro</button>
                </div>
            )}

            {mode === "join" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <input
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        placeholder="Codice Stanza"
                        style={{ padding: '0.6rem 1rem', borderRadius: '16px', border: '3px solid var(--carrd-border)', fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.2rem', textAlign: 'center', color: 'var(--carrd-border)', outline: 'none' }}
                    />
                    {errorMsg && <div style={{ color: '#e55', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>{errorMsg}</div>}
                    <button style={btn('var(--secondary)')} onClick={handleJoin} disabled={joinCode.length < 4 || !connected}>
                        <IconCheck /> Unisciti
                    </button>
                    <button style={btn('white')} onClick={() => setMode("menu")}><IconBack /> Indietro</button>
                </div>
            )}
        </div>
    );
}
