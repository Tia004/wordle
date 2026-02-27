"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { evaluateGuess, updateUsedColors } from "@/lib/gameLogic";
import { WORDS_IT, WORDS_EN } from "@/lib/words";
import Board from "@/components/Board";
import Keyboard from "@/components/Keyboard";
import Toaster, { useToast } from "@/components/Toaster";

// ─── ScoreHUD ────────────────────────────────────────────────────────────────
function ScoreHUD({ myName, oppName, myScore, oppScore, round, totalRounds, onQuit, quitVotes }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '0.5rem', gap: '0.3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'var(--secondary)', border: '2px solid var(--carrd-border)', borderRadius: '16px', padding: '0.4rem 1rem' }}>
                <div style={{ fontWeight: '900', color: 'var(--carrd-border)', fontSize: '0.9rem' }}>{myName}: {myScore}pt</div>
                <div style={{ fontWeight: 'bold', color: 'var(--foreground)', fontSize: '0.8rem' }}>Round {round}/{totalRounds}</div>
                <div style={{ fontWeight: '900', color: 'var(--carrd-border)', fontSize: '0.9rem' }}>{oppName}: {oppScore}pt</div>
            </div>
            {quitVotes && quitVotes.votes > 0 ? (
                <div style={{ textAlign: 'center', background: 'var(--accent-pink)', border: '2px solid var(--carrd-border)', borderRadius: '12px', padding: '0.2rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--carrd-border)' }}>
                    In attesa che l'avversario abbandoni... ({quitVotes.votes}/{quitVotes.total})
                </div>
            ) : (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                    <button onClick={onQuit} style={{ background: 'white', border: '2px solid var(--carrd-border)', borderRadius: '12px', padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: '800', color: '#e55', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Abbandona Partita
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MultiplayerGame() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const { socket, connected } = useSocket();

    // Game state
    const [phase, setPhase] = useState<'waiting' | 'word_select' | 'playing' | 'spectating' | 'round_end' | 'game_end'>('waiting');
    const [round, setRound] = useState(1);
    const [totalRounds, setTotalRounds] = useState(3);
    const [lang, setLang] = useState<"it" | "en">("it");

    // Role
    const [isWordSetter, setIsWordSetter] = useState(false);
    const isWordSetterRef = useRef(false);

    // My game (guesser)
    const [myAnswer, setMyAnswer] = useState('');
    const [myGuesses, setMyGuesses] = useState<string[]>([]);
    const [myCurrentGuess, setMyCurrentGuess] = useState('');
    const [usedColors, setUsedColors] = useState<Record<string, string>>({});
    const [myGameStatus, setMyGameStatus] = useState<'IN_PROGRESS' | 'WIN' | 'FAIL'>('IN_PROGRESS');
    const [shakeRow, setShakeRow] = useState(false);

    // Spectator (setter watching guesser) / opponent live view
    const [oppGuesses, setOppGuesses] = useState<string[]>([]);
    const [oppCurrentGuess, setOppCurrentGuess] = useState('');
    const [chosenWord, setChosenWord] = useState(''); // only setter knows this

    // Scores
    const [myScore, setMyScore] = useState(0);
    const [oppScore, setOppScore] = useState(0);
    const [myName] = useState(session?.user?.name ?? 'Tu');
    const [oppName, setOppName] = useState('Avversario');

    // Word selection state
    const [useCustom, setUseCustom] = useState(false);
    const [wordInput, setWordInput] = useState('');
    const [wordError, setWordError] = useState('');
    const [wordSubmitting, setWordSubmitting] = useState(false);
    const [wordReady, setWordReady] = useState(false);
    const [myCoins, setMyCoins] = useState<number | null>(null);
    const [randomOptions, setRandomOptions] = useState<string[]>([]);

    // Round / Game end
    const [roundEndData, setRoundEndData] = useState<any>(null);
    const [gameEndData, setGameEndData] = useState<any>(null);

    // Vote to Quit
    const [quitVotes, setQuitVotes] = useState<{votes: number, total: number} | null>(null);

    const { toastMessage, showToast } = useToast();
    const myGameDoneRef = useRef(false);

    // Fetch coins on mount
    useEffect(() => {
        fetch('/api/coins').then(r => r.json()).then(d => setMyCoins(d.coins ?? 0));
    }, []);

    // Generate random word options when becoming a setter
    useEffect(() => {
        if (isWordSetter && phase === 'word_select' && !wordReady && randomOptions.length === 0) {
            const dict = lang === 'en' ? WORDS_EN : WORDS_IT;
            const options: string[] = [];
            while(options.length < 4) {
               const idx = Math.floor(Math.random() * dict.length);
               const w = dict[idx].toUpperCase();
               if (!options.includes(w)) options.push(w);
            }
            setRandomOptions(options);
        }
    }, [isWordSetter, phase, wordReady, lang, randomOptions.length]);

    // ── Socket event listeners ──────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        // ── Sync state on mount (in case phase_change fired before this page mounted) ──
        socket.emit('request_room_state', { roomId });

        socket.on('room_state', ({ phase: p, round: r, totalRounds: tr, lang: l, wordSetterId, hostName, guestName, hostScore, guestScore, myGuesses, myCurrentGuess, oppGuesses, oppCurrentGuess }: any) => {
            // Only apply if we're still in the initial waiting state (or just reconnecting)
            setTotalRounds(tr);
            if (l) setLang(l);
            if (p) {
                const iAmSetter = wordSetterId === socket.id;
                isWordSetterRef.current = iAmSetter;
                setIsWordSetter(iAmSetter);
                setPhase(p);
                setRound(r);
                
                // Restore scores
                const myN = session?.user?.name ?? '';
                const iAmHost = myN === hostName;
                if (hostName && guestName) {
                    setOppName(iAmHost ? guestName : hostName);
                }
                if (hostScore !== undefined && guestScore !== undefined) {
                    setMyScore(iAmHost ? hostScore : guestScore);
                    setOppScore(iAmHost ? guestScore : hostScore);
                }
                
                // Restore board
                if (myGuesses) setMyGuesses(myGuesses);
                if (myCurrentGuess) setMyCurrentGuess(myCurrentGuess);
                if (oppGuesses) setOppGuesses(oppGuesses);
                if (oppCurrentGuess) setOppCurrentGuess(oppCurrentGuess);
                
                if (myGuesses && myGuesses.length >= 6) {
                    finishedRef.current = true;
                }
            }
        });

        socket.on('player_joined', ({ host, guest, totalRounds: tr }: any) => {
            setTotalRounds(tr);
            setOppName(session?.user?.name === host ? guest : host);
        });

        socket.on('phase_change', ({ phase: p, round: r, wordSetterId }: any) => {
            const iAmSetter = wordSetterId === socket.id;
            isWordSetterRef.current = iAmSetter;
            setIsWordSetter(iAmSetter);
            setPhase(p);
            setRound(r);
            // Reset round state
            setMyGuesses([]);
            setMyCurrentGuess([]);
            setMyCurrentGuess('');
            setUsedColors({});
            setMyGameStatus('IN_PROGRESS');
            setOppGuesses([]);
            setOppCurrentGuess('');
            setWordInput('');
            setUseCustom(false);
            setWordError('');
            setWordReady(false);
            setChosenWord('');
            setRandomOptions([]);
            setRoundEndData(null);
            myGameDoneRef.current = false;
        });

        // Setter submitted word — switch to spectator
        socket.on('setter_start', ({ guesserName }: any) => {
            setPhase('spectating');
            setOppName(guesserName);
        });

        // Guesser receives the word — start playing
        socket.on('game_start', ({ yourWord, opponentName }: any) => {
            setMyAnswer(yourWord);
            setOppName(opponentName);
            setPhase('playing');
        });

        // Both setter (spectator) and guesser receive typing/guess updates
        socket.on('opponent_typing', ({ currentGuess }: any) => {
            setOppCurrentGuess(currentGuess);
        });

        socket.on('opponent_guess', ({ guesses }: any) => {
            setOppGuesses(guesses);
            setOppCurrentGuess('');
        });

        socket.on('round_end', (data: any) => {
            setPhase('round_end');
            setRoundEndData(data);
            // Figure out which score is mine
            const iAmHost = data.hostName === myName;
            setMyScore(iAmHost ? data.hostScore : data.guestScore);
            setOppScore(iAmHost ? data.guestScore : data.hostScore);
        });

        socket.on('game_end', (data: any) => {
            setPhase('game_end');
            setGameEndData(data);
            const iAmHost = data.hostName === myName;
            setMyScore(iAmHost ? data.hostScore : data.guestScore);
            setOppScore(iAmHost ? data.guestScore : data.hostScore);
            if (data.winnerId === socket.id) {
                fetch('/api/stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ multiplayerCoins: Math.max(data.hostScore, data.guestScore) })
                });
            }
        });

        socket.on('opponent_disconnected', () => {
            showToast("😱 L'avversario si è disconnesso!");
        });

        socket.on('guest_left', () => {
            showToast("😱 L'avversario ha lasciato la stanza!");
        });
        
        socket.on('quit_vote_update', ({ votes, total }: any) => {
            setQuitVotes({ votes, total });
        });
        
        socket.on('force_disconnect_room', () => {
            router.push('/');
        });

        return () => {
            socket.off('room_state');
            socket.off('player_joined');
            socket.off('phase_change');
            socket.off('setter_start');
            socket.off('game_start');
            socket.off('opponent_typing');
            socket.off('opponent_guess');
            socket.off('round_end');
            socket.off('game_end');
            socket.off('opponent_disconnected');
            socket.off('guest_left');
        };
    }, [socket, session, router, myName]);

    // ── Emit typing sync ───────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'playing' || myGameStatus !== 'IN_PROGRESS') return;
        socket?.emit('typing', { currentGuess: myCurrentGuess });
    }, [myCurrentGuess, phase, myGameStatus, socket]);
    
    // ── Quit Handler ───────────────────────────────────────────────────────
    const handleQuit = () => {
        socket?.emit('vote_quit');
    };

    // ── Keyboard handlers ──────────────────────────────────────────────────
    const triggerShake = () => { setShakeRow(true); setTimeout(() => setShakeRow(false), 400); };

    const onChar = useCallback((char: string) => {
        if (myGameStatus !== 'IN_PROGRESS' || phase !== 'playing') return;
        setMyCurrentGuess(prev => prev.length < 5 ? prev + char : prev);
    }, [myGameStatus, phase]);

    const onDelete = useCallback(() => {
        if (myGameStatus !== 'IN_PROGRESS' || phase !== 'playing') return;
        setMyCurrentGuess(prev => prev.slice(0, -1));
    }, [myGameStatus, phase]);

    const onEnter = useCallback(() => {
        if (myGameStatus !== 'IN_PROGRESS' || phase !== 'playing') return;
        if (myCurrentGuess.length !== 5) { triggerShake(); showToast('5 lettere!'); return; }
        const dict = lang === 'en' ? WORDS_EN : WORDS_IT;
        if (!dict.includes(myCurrentGuess)) {
            triggerShake(); showToast('Parola non nel dizionario!'); return;
        }
        const evaluation = evaluateGuess(myCurrentGuess, myAnswer);
        const newColors = updateUsedColors(usedColors, myCurrentGuess, evaluation);
        const newGuesses = [...myGuesses, myCurrentGuess];
        setMyGuesses(newGuesses);
        setUsedColors(newColors);
        setMyCurrentGuess('');
        socket?.emit('submit_guess', { guess: myCurrentGuess });

        let status: 'IN_PROGRESS' | 'WIN' | 'FAIL' = 'IN_PROGRESS';
        if (myCurrentGuess === myAnswer) status = 'WIN';
        else if (newGuesses.length === 6) status = 'FAIL';

        if (status !== 'IN_PROGRESS') {
            setMyGameStatus(status);
            myGameDoneRef.current = true;
            if (status === 'WIN') showToast(`✅ Indovinata in ${newGuesses.length}!`);
            else showToast(`❌ La parola era: ${myAnswer}`);
            socket?.emit('round_finish', { attempts: newGuesses.length, won: status === 'WIN' });
        }
    }, [myCurrentGuess, myAnswer, myGuesses, usedColors, phase, myGameStatus, socket, showToast]);

    // Physical keyboard
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.repeat) return;
            if (e.key === 'Enter') onEnter();
            else if (e.key === 'Backspace') onDelete();
            else if (/^[A-Za-z]$/.test(e.key)) onChar(e.key.toUpperCase());
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onChar, onDelete, onEnter]);

    // ── Word submission handler ─────────────────────────────────────────────
    const submitWord = async () => {
        setWordError('');
        const w = wordInput.trim().toUpperCase();
        if (w.length !== 5) { setWordError('La parola deve avere esattamente 5 lettere!'); return; }

        if (!useCustom) {
            const dict = lang === 'en' ? WORDS_EN : WORDS_IT;
            if (!dict.includes(w)) {
                setWordError('Parola non nel dizionario! Usa la parola custom (100 🪙) per parole libere.');
                return;
            }
            socket?.emit('set_word', { word: w, isCustom: false });
            setWordReady(true);
            setChosenWord(w);
        } else {
            // Custom word — deduct 100 coins first
            setWordSubmitting(true);
            try {
                const res = await fetch('/api/coins', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: 100 }),
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    setWordError(data.message ?? 'Errore nel pagamento!');
                    setWordSubmitting(false);
                    return;
                }
                setMyCoins(data.newTotal);
                socket?.emit('set_word', { word: w, isCustom: true });
                setWordReady(true);
                setChosenWord(w);
            } catch {
                setWordError('Errore di rete, riprova!');
            }
            setWordSubmitting(false);
        }
    };

    // ── Shared card style ──────────────────────────────────────────────────
    const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
        background: 'var(--secondary)',
        border: '3px solid var(--carrd-border)',
        borderRadius: '20px',
        padding: '1rem 1.5rem',
        fontWeight: 'bold',
        color: 'var(--carrd-border)',
        textAlign: 'center',
        ...extra,
    });

    const btn = (bg: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
        background: bg,
        border: '3px solid var(--carrd-border)',
        borderRadius: '20px',
        padding: '0.6rem 1.6rem',
        fontWeight: '800',
        fontSize: '0.95rem',
        color: 'var(--carrd-border)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        ...extra,
    });

    // ── RENDER ─────────────────────────────────────────────────────────────

    if (phase === 'waiting') return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--carrd-border)' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>🎀 Stanza: <span style={{ letterSpacing: '0.3rem' }}>{roomId}</span></div>
            <div style={{ marginTop: '0.5rem', color: 'var(--foreground)' }}>In attesa dell'avversario…</div>
        </div>
    );

    // ── Word select phase ──────────────────────────────────────────────────
    if (phase === 'word_select') return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--carrd-border)' }}>
                🔐 Round {round} — {isWordSetter ? 'Scegli la Parola!' : 'Attendi…'}
            </div>

            {isWordSetter ? (
                <>
                    <div style={{ color: 'var(--foreground)', fontSize: '0.85rem', textAlign: 'center' }}>
                        Hai scelto TU la parola che <strong>{oppName}</strong> dovrà indovinare!
                    </div>

                    {/* Coins display */}
                    {myCoins !== null && (
                        <div style={{ background: 'var(--accent-pink)', border: '2px solid var(--carrd-border)', borderRadius: '12px', padding: '0.3rem 1rem', fontSize: '0.85rem', fontWeight: '800', color: 'var(--carrd-border)' }}>
                            🪙 {myCoins} monete
                        </div>
                    )}

                    {!wordReady ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                            {!useCustom ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {randomOptions.map(w => (
                                        <button 
                                            key={w} 
                                            onClick={() => { setWordInput(w); setWordError(''); }}
                                            style={btn(wordInput === w ? 'var(--primary)' : 'white', { justifyContent: 'center', fontSize: '1.2rem', padding: '1rem', color: wordInput === w ? 'white' : 'var(--carrd-border)' })}
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <input
                                    value={wordInput}
                                    onChange={e => setWordInput(e.target.value.toUpperCase())}
                                    maxLength={5}
                                    placeholder="Parola da 5 lettere"
                                    style={{ padding: '0.6rem 1rem', borderRadius: '16px', border: '3px solid var(--carrd-border)', fontSize: '1.4rem', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.4rem', textAlign: 'center', color: 'var(--carrd-border)', outline: 'none' }}
                                />
                            )}

                            {/* Custom word toggle */}
                            <button
                                onClick={() => { setUseCustom(c => !c); setWordError(''); setWordInput(''); }}
                                style={btn(useCustom ? 'var(--accent-pink)' : 'white', { justifyContent: 'center', fontSize: '0.85rem' })}
                            >
                                {useCustom ? '✅' : '✨'} Parola custom libera — 100 🪙
                                {useCustom ? ' (attiva)' : ''}
                            </button>

                            {useCustom && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', textAlign: 'center', fontStyle: 'italic' }}>
                                    La parola custom può essere qualsiasi parola di 5 lettere, anche non nel dizionario.
                                    {myCoins !== null && myCoins < 100 && (
                                        <span style={{ display: 'block', color: '#e55', fontWeight: 'bold', marginTop: '0.3rem' }}>
                                            ⚠️ Monete insufficienti! Ti servono 100 🪙
                                        </span>
                                    )}
                                </div>
                            )}

                            {wordError && <div style={{ color: '#e55', fontWeight: 'bold', textAlign: 'center', fontSize: '0.85rem' }}>{wordError}</div>}

                            <button
                                onClick={submitWord}
                                disabled={wordInput.length !== 5 || wordSubmitting || (useCustom && (myCoins ?? 0) < 100)}
                                style={btn('var(--primary)', {
                                    justifyContent: 'center',
                                    opacity: (wordInput.length !== 5 || wordSubmitting || (useCustom && (myCoins ?? 0) < 100)) ? 0.5 : 1,
                                    cursor: (wordInput.length !== 5 || wordSubmitting || (useCustom && (myCoins ?? 0) < 100)) ? 'not-allowed' : 'pointer',
                                })}
                            >
                                {wordSubmitting ? '⏳ Pagamento…' : useCustom ? `✅ Conferma (−100 🪙)` : '✅ Conferma Parola'}
                            </button>
                        </div>
                    ) : (
                        <div style={card()}>
                            ✅ Parola <strong style={{ letterSpacing: '0.2rem' }}>{chosenWord}</strong> confermata!<br />
                            <span style={{ fontWeight: 'normal', fontSize: '0.9rem' }}>Stai guardando {oppName} indovinare…</span>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={card({ fontSize: '0.95rem' })}>
                        ⏳ <strong>{oppName}</strong> sta scegliendo la parola che devi indovinare…
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', fontStyle: 'italic' }}>
                        Preparati!
                    </div>
                </div>
            )}
        </div>
    );

    // ── Game end ───────────────────────────────────────────────────────────
    if (phase === 'game_end' && gameEndData) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--carrd-border)' }}>🏆 Fine Partita!</div>
            <div style={card()}>
                {gameEndData.winnerName
                    ? <><strong>{gameEndData.winnerName}</strong> vince! 🎉</>
                    : '🤝 Pareggio!'}
            </div>
            {gameEndData.winnerId === socket?.id && (
                <div style={card({ background: 'var(--primary)', fontSize: '1.1rem' })}>
                    +{Math.max(gameEndData.hostScore, gameEndData.guestScore)} 🪙 Monete!
                </div>
            )}
            <div style={{ display: 'flex', gap: '2rem', fontWeight: 'bold', color: 'var(--carrd-border)' }}>
                <div>{myName}: {myScore}pt</div>
                <div>{oppName}: {oppScore}pt</div>
            </div>
            <button onClick={() => router.push('/multiplayer')} style={btn('var(--accent-pink)', { justifyContent: 'center' })}>
                🔄 Gioca Ancora
            </button>
        </div>
    );

    // ── Round end ──────────────────────────────────────────────────────────
    if (phase === 'round_end' && roundEndData) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--carrd-border)' }}>🏁 Fine Round {round}!</div>
            <div style={card()}>
                {roundEndData.guesserWon
                    ? <>✅ Indovinata in <strong>{roundEndData.attempts}</strong> tentativi!</>
                    : <>❌ Non è stata indovinata!</>
                }
            </div>
            <div style={{ display: 'flex', gap: '2rem', fontWeight: 'bold', color: 'var(--carrd-border)' }}>
                <div>{myName}: {myScore}pt</div>
                <div>{oppName}: {oppScore}pt</div>
            </div>
            <div style={{ color: 'var(--foreground)', fontSize: '0.9rem', fontStyle: 'italic' }}>Prossimo round tra poco…</div>
        </div>
    );

    // ── Spectating phase (setter watching guesser) ─────────────────────────
    if (phase === 'spectating') return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
            <ScoreHUD myName={myName} oppName={oppName} myScore={myScore} oppScore={oppScore} round={round} totalRounds={totalRounds} onQuit={handleQuit} quitVotes={quitVotes} />
            <div style={card({ width: '100%', marginBottom: '0.5rem', background: 'var(--accent-pink)', fontSize: '0.9rem' })}>
                👁 Stai guardando <strong>{oppName}</strong> indovinare <span style={{ letterSpacing: '0.2rem' }}>{chosenWord || '?????'}</span>
            </div>
            <Board guesses={oppGuesses} currentGuess={oppCurrentGuess} answer={chosenWord} />
            <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', fontStyle: 'italic', marginTop: '1rem', textAlign: 'center' }}>
                {oppGuesses.length > 0
                    ? `${oppGuesses.length}/6 tentativi usati`
                    : 'In attesa del primo tentativo…'}
            </div>
        </div>
    );

    // ── Playing phase (guesser) ────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
            <Toaster message={toastMessage} onClose={() => {}} />
            <ScoreHUD myName={myName} oppName={oppName} myScore={myScore} oppScore={oppScore} round={round} totalRounds={totalRounds} onQuit={handleQuit} quitVotes={quitVotes} />

            {myGameStatus !== 'IN_PROGRESS' && (
                <div style={card({ width: '100%', marginBottom: '0.5rem', background: myGameStatus === 'WIN' ? 'var(--primary)' : 'var(--absent)' })}>
                    {myGameStatus === 'WIN' ? '🎉 Indovinata!' : `❌ La parola era: ${myAnswer}`}
                    <span style={{ marginLeft: '0.5rem', color: 'var(--foreground)', fontWeight: 'normal' }}>In attesa della fine round…</span>
                </div>
            )}
            <Board guesses={myGuesses} currentGuess={myCurrentGuess} answer={myAnswer} shakeRow={shakeRow} />
            <Keyboard onChar={onChar} onDelete={onDelete} onEnter={onEnter} usedColors={usedColors} />
        </div>
    );
}
