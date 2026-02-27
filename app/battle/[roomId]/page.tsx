"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import Board from "@/components/Board";
import Keyboard from "@/components/Keyboard";
import { evaluateGuess, updateUsedColors } from "@/lib/gameLogic";

type Player = { id: string; name: string; score: number; roundPoints?: number };
type Phase = "waiting" | "playing" | "round_end" | "game_end";

function MiniBoard({ guesses, word, size = 20 }: { guesses: string[]; word: string; size?: number }) {
    const rows = 6;
    const cols = 5;
    return (
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${rows}, ${size}px)`, gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: '2px' }}>
            {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => {
                    const guess = guesses[r];
                    const letter = guess?.[c] ?? '';
                    let bg = 'transparent';
                    let border = '1px solid var(--carrd-border)';
                    if (guess) {
                        const result = evaluateGuess(guess, word);
                        const status = result[c];
                        bg = status === 'correct' ? 'var(--primary)' : status === 'present' ? 'var(--secondary)' : 'var(--absent)';
                    }
                    return <div key={`${r}-${c}`} style={{ width: size, height: size, background: bg, border, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${size * 0.45}px`, fontWeight: '800', color: 'var(--carrd-border)' }}>{letter}</div>;
                })
            )}
        </div>
    );
}

export default function BattleRoom() {
    const params = useParams();
    const roomId = params?.roomId as string;
    const { data: session } = useSession();
    const router = useRouter();
    const { socket, connected } = useSocket();

    const [phase, setPhase] = useState<Phase>("waiting");
    const [round, setRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(3);
    const [word, setWord] = useState("");
    const [lang, setLang] = useState<"it" | "en">("it");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [usedColors, setUsedColors] = useState<Record<string, string>>({});
    const [gameStatus, setGameStatus] = useState<"IN_PROGRESS" | "WIN" | "FAIL">("IN_PROGRESS");
    const [scores, setScores] = useState<Player[]>([]);
    const [opponentBoards, setOpponentBoards] = useState<Record<string, string[]>>({});
    const [opponentTyping, setOpponentTyping] = useState<Record<string, string>>({});
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [winnerName, setWinnerName] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [toastMsg, setToastMsg] = useState("");
    const [quitVotes, setQuitVotes] = useState<{votes: number, total: number} | null>(null);
    const finishedRef = useRef(false);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), 2500);
    };

    useEffect(() => {
        if (!socket) return;

        const onRoundStart = ({ round: r, totalRounds: tr, word: w, lang: l, players }: any) => {
            setRound(r);
            setTotalRounds(tr);
            setWord(w);
            setLang(l);
            setGuesses([]);
            setCurrentGuess("");
            setUsedColors({});
            setGameStatus("IN_PROGRESS");
            setOpponentBoards({});
            setOpponentTyping({});
            setPhase("playing");
            setCountdown(null);
            if (players) {
                 setScores(players.map((p: any) => ({ id: p.id, name: p.name, score: p.score })));
            }
            finishedRef.current = false;
        };

        // ── Sync state on mount (in case battle_round_start fired before this page mounted) ──
        socket.emit('request_battle_state', { roomId });

        socket.on('battle_state', ({ phase: p, round: r, totalRounds: tr, lang: l, word: w, players, myGuesses, myCurrentGuess, opponentBoards, opponentTyping, roundFinished }: any) => {
            if (p && p !== 'lobby') {
                setPhase(p);
                setRound(r);
                setTotalRounds(tr);
                setLang(l);
                setWord(w);
                if (players) {
                    setScores(players.map((p: any) => ({ id: p.id, name: p.name, score: p.score })));
                }
                // Restore board state
                if (myGuesses) setGuesses(myGuesses);
                if (myCurrentGuess) setCurrentGuess(myCurrentGuess);
                if (opponentBoards) setOpponentBoards(opponentBoards);
                if (opponentTyping) setOpponentTyping(opponentTyping);
                if (roundFinished) finishedRef.current = true;
                
                // Recalculate colors for existing guesses
                if (myGuesses && w) {
                     let colors: Record<string, string> = {};
                     myGuesses.forEach((g: string) => {
                         const evalRes = evaluateGuess(g, w);
                         colors = updateUsedColors(colors, g, evalRes);
                     });
                     setUsedColors(colors);
                }
            }
        });

        const onOpponentTyping = ({ playerId, currentGuess: cg }: any) => {
            setOpponentTyping(prev => ({ ...prev, [playerId]: cg }));
        };

        const onOpponentGuess = ({ playerId, guess }: any) => {
            setOpponentBoards(prev => ({
                ...prev,
                [playerId]: [...(prev[playerId] ?? []), guess]
            }));
            setOpponentTyping(prev => ({ ...prev, [playerId]: '' }));
        };

        const onPlayerFinished = ({ playerName, points }: any) => {
            showToast(`${playerName}: ${points} pt`);
        };

        const onRoundEnd = ({ round: r, scores: s, totalRounds: tr }: any) => {
            setScores(s.map((p: any) => ({ id: p.id, name: p.name, score: p.totalScore, roundPoints: p.roundPoints })));
            setPhase("round_end");
            if (r < tr) {
                let c = 4;
                setCountdown(c);
                const t = setInterval(() => {
                    c--;
                    if (c <= 0) { clearInterval(t); setCountdown(null); }
                    else setCountdown(c);
                }, 1000);
            }
        };

        const onGameEnd = ({ scores: s, winnerId: wid, winnerName: wn, winnerScore: ws }: any) => {
            setScores(s.map((p: any) => ({ id: p.id, name: p.name, score: p.totalScore, roundPoints: p.roundPoints })));
            setWinnerId(wid);
            setWinnerName(wn);
            setPhase("game_end");

            // Award coins to winner
            if (socket.id === wid && ws > 0) {
                fetch('/api/stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ multiplayerCoins: ws }),
                });
            }
        };

        const onDisconnect = () => showToast("Un giocatore si è disconnesso");

        socket.on("battle_round_start", onRoundStart);
        socket.on("battle_opponent_typing", onOpponentTyping);
        socket.on("battle_opponent_guess", onOpponentGuess);
        socket.on("battle_player_finished", onPlayerFinished);
        socket.on("battle_round_end", onRoundEnd);
        socket.on("battle_game_end", onGameEnd);
        socket.on("battle_player_left", onDisconnect);
        socket.on("quit_vote_update", ({votes, total}: any) => {
            setQuitVotes({votes, total});
        });
        socket.on("force_disconnect_room", () => {
            router.push('/');
        });

        return () => {
            socket.off('battle_state');
            socket.off("battle_round_start", onRoundStart);
            socket.off("battle_opponent_typing", onOpponentTyping);
            socket.off("battle_opponent_guess", onOpponentGuess);
            socket.off("battle_player_finished", onPlayerFinished);
            socket.off("battle_round_end", onRoundEnd);
            socket.off("battle_game_end", onGameEnd);
            socket.off("battle_player_left", onDisconnect);
        };
    }, [socket]);

    const onChar = (char: string) => {
        if (gameStatus !== "IN_PROGRESS" || guesses.length >= 6 || finishedRef.current) return;
        if (currentGuess.length < 5) {
            const ng = currentGuess + char;
            setCurrentGuess(ng);
            socket?.emit("battle_typing", { currentGuess: ng });
        }
    };

    const onDelete = () => {
        if (gameStatus !== "IN_PROGRESS" || finishedRef.current) return;
        const ng = currentGuess.slice(0, -1);
        setCurrentGuess(ng);
        socket?.emit("battle_typing", { currentGuess: ng });
    };

    const onEnter = () => {
        if (gameStatus !== "IN_PROGRESS" || currentGuess.length !== 5 || finishedRef.current) return;
        const guess = currentGuess.toUpperCase();
        const newGuesses = [...guesses, guess];
        setGuesses(newGuesses);
        socket?.emit("battle_submit_guess", { guess });
        setCurrentGuess("");
        socket?.emit("battle_typing", { currentGuess: "" });

        const colors = evaluateGuess(guess, word);
        setUsedColors(prev => updateUsedColors(prev, guess, colors));

        if (guess === word) {
            setGameStatus("WIN");
            finishedRef.current = true;
            socket?.emit("battle_round_finish", { attempts: newGuesses.length, won: true });
        } else if (newGuesses.length >= 6) {
            setGameStatus("FAIL");
            finishedRef.current = true;
            socket?.emit("battle_round_finish", { attempts: 6, won: false });
        }
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (phase !== "playing") return;
            if (e.key === "Backspace") onDelete();
            else if (e.key === "Enter") onEnter();
            else if (/^[a-zA-Z]$/.test(e.key)) onChar(e.key.toUpperCase());
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [phase, currentGuess, guesses, gameStatus, word]);

    const panelStyle: React.CSSProperties = {
        background: 'var(--carrd-bg)', border: '3px solid var(--carrd-border)',
        borderRadius: '16px', padding: '0.8rem',
    };

    // ── Waiting for round to start ────────────────────────────────────────────
    if (phase === "waiting") return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--carrd-border)', fontWeight: 'bold' }}>
            In attesa dell'inizio della battaglia…
        </div>
    );

    // ── Round / Game End ──────────────────────────────────────────────────────
    if (phase === "round_end" || phase === "game_end") {
        const isGameOver = phase === "game_end";
        const sorted = [...scores].sort((a, b) => b.score - a.score);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', width: '100%', maxWidth: '360px', alignItems: 'center' }}>
                <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--carrd-border)' }}>
                    {isGameOver ? "Fine Partita!" : `Round ${round} — Risultati`}
                </div>
                {isGameOver && winnerId === socket?.id && (
                    <div style={{ ...panelStyle, background: 'var(--primary)', textAlign: 'center', fontWeight: '900', width: '100%' }}>
                        Hai vinto! Le tue monete sono state aggiornate!
                    </div>
                )}
                {isGameOver && winnerName && winnerId !== socket?.id && (
                    <div style={{ ...panelStyle, background: 'var(--absent)', textAlign: 'center' }}>
                        Ha vinto {winnerName}!
                    </div>
                )}
                <div style={{ width: '100%', ...panelStyle, padding: 0, overflow: 'hidden' }}>
                    {sorted.map((p, i) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0.8rem', borderBottom: i < sorted.length - 1 ? '1px solid var(--absent)' : 'none', background: i === 0 ? 'rgba(170,224,184,0.3)' : 'transparent' }}>
                            <span style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--carrd-border)', minWidth: '1.5rem' }}>#{i + 1}</span>
                            <span style={{ flex: 1, fontWeight: '700', color: 'var(--carrd-border)' }}>{p.name}</span>
                            {p.roundPoints !== undefined && <span style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>+{p.roundPoints}</span>}
                            <span style={{ fontWeight: '900', color: 'var(--carrd-border)' }}>{p.score} pt</span>
                        </div>
                    ))}
                </div>
                {!isGameOver && countdown !== null && (
                    <div style={{ color: 'var(--foreground)', fontSize: '0.9rem' }}>Prossimo round tra {countdown}s…</div>
                )}
                {isGameOver && (
                    <button onClick={() => router.push('/')} style={{ background: 'var(--accent-pink)', border: '3px solid var(--carrd-border)', borderRadius: '20px', padding: '0.6rem 1.4rem', fontWeight: '800', color: 'var(--carrd-border)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Torna alla Home
                    </button>
                )}
            </div>
        );
    }

    // ── Playing ───────────────────────────────────────────────────────────────
    const otherPlayerIds = scores.filter(p => p.id !== socket?.id).map(p => p.id);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', gap: '0.3rem' }}>
            {toastMsg && (
                <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--secondary)', border: '2px solid var(--carrd-border)', borderRadius: '16px', padding: '0.4rem 1rem', fontWeight: '700', color: 'var(--carrd-border)', zIndex: 999 }}>
                    {toastMsg}
                </div>
            )}

            {/* HUD: round + scores */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: '700', color: 'var(--carrd-border)' }}>
                    <div>Round {round}/{totalRounds}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {scores.map(p => (
                            <span key={p.id} style={{ background: p.id === socket?.id ? 'var(--primary)' : 'var(--absent)', borderRadius: '10px', padding: '0.1rem 0.5rem' }}>
                                {p.name.split(' ')[0]}: {p.score}
                            </span>
                        ))}
                    </div>
                </div>
                
                {quitVotes && quitVotes.votes > 0 ? (
                    <div style={{ textAlign: 'center', background: 'var(--accent-pink)', border: '2px solid var(--carrd-border)', borderRadius: '12px', padding: '0.2rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--carrd-border)' }}>
                        In attesa che tutti abbandonino... ({quitVotes.votes}/{quitVotes.total})
                    </div>
                ) : (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                        <button onClick={() => socket?.emit('vote_quit')} style={{ background: 'white', border: '2px solid var(--carrd-border)', borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: '800', color: '#e55', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Abbandona Partita
                        </button>
                    </div>
                )}
            </div>

            {/* Main board */}
            <Board guesses={guesses} currentGuess={currentGuess} answer={word} shakeRow={false} />

            {/* Win/Fail small banner */}
            {gameStatus !== "IN_PROGRESS" && (
                <div style={{ padding: '0.3rem 1rem', borderRadius: '12px', border: '2px solid var(--carrd-border)', fontWeight: '700', fontSize: '0.85rem', background: gameStatus === "WIN" ? 'var(--primary)' : 'var(--absent)', color: gameStatus === "WIN" ? 'var(--carrd-border)' : 'white', flexShrink: 0 }}>
                    {gameStatus === "WIN" ? "Indovinato! In attesa degli altri..." : `Oh no! La parola era ${word}. In attesa...`}
                </div>
            )}

            {/* Keyboard */}
            <Keyboard onChar={onChar} onDelete={onDelete} onEnter={onEnter} usedColors={usedColors} />

            {/* Opponent mini-boards */}
            {otherPlayerIds.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
                    {otherPlayerIds.map(pid => {
                        const player = scores.find(p => p.id === pid);
                        return (
                            <div key={pid} style={{ ...panelStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', padding: '0.4rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--carrd-border)' }}>{player?.name ?? pid.slice(0, 6)}</div>
                                <MiniBoard guesses={opponentBoards[pid] ?? []} word={word} size={16} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
