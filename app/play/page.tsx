"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Board from "@/components/Board";
import Keyboard from "@/components/Keyboard";
import LanguageDropdown from "@/components/LanguageDropdown";
import Toaster, { useToast } from "@/components/Toaster";
import LoadingScreen from "@/components/LoadingScreen";
import { WORDS_IT, WORDS_EN, getRandomWord } from "@/lib/words";
import { evaluateGuess, updateUsedColors } from "@/lib/gameLogic";

export default function Play() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryLang = (searchParams.get('lang') === 'en' ? 'en' : 'it') as "it" | "en";

    const [lang, setLang] = useState<"it" | "en">(queryLang);
    const [answer, setAnswer] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [usedColors, setUsedColors] = useState<Record<string, string>>({});
    const [gameStatus, setGameStatus] = useState<"IN_PROGRESS" | "WIN" | "FAIL">("IN_PROGRESS");
    const [coins, setCoins] = useState<number | null>(null);
    const [isBuyingHint, setIsBuyingHint] = useState(false);
    const [showConfirmHome, setShowConfirmHome] = useState(false);

    // Toaster and shake state
    const { toastMessage, showToast } = useToast();
    const [shakeRow, setShakeRow] = useState(false);

    useEffect(() => {
        // Hydration safe init
        if (!answer) setAnswer(getRandomWord(lang));
        // Fetch coins
        fetch('/api/coins')
            .then(res => res.json())
            .then(data => {
                if (data.coins !== undefined) setCoins(data.coins);
            })
            .catch(e => console.error("Error fetching coins", e));
    }, [answer, lang]);

    const changeLanguage = (newLang: "it" | "en") => {
        if (guesses.length > 0 && gameStatus === "IN_PROGRESS" && newLang !== lang) {
            if (!confirm("Cambiare lingua azzererà la partita in corso. Procedere?")) {
                return;
            }
        }
        if (newLang !== lang) {
            router.push(`/play?lang=${newLang}`);
        }
    };
    
    // Explicit reset when user clicks Play Again or URL forces new load
    useEffect(() => {
        // If the queryLang is different from our local state, sync it and reset
        if (queryLang !== lang) {
            setLang(queryLang);
            setAnswer(getRandomWord(queryLang));
            setGuesses([]);
            setUsedColors({});
            setGameStatus("IN_PROGRESS");
            setCurrentGuess("");
        }
    }, [queryLang, lang]);

    const resetGame = () => {
        setAnswer(getRandomWord(lang));
        setGuesses([]);
        setUsedColors({});
        setGameStatus("IN_PROGRESS");
        setCurrentGuess("");
    };

    const onChar = (char: string) => {
        if (gameStatus !== "IN_PROGRESS") return;
        if (currentGuess.length < 5) {
            setCurrentGuess(currentGuess + char);
        }
    };

    const onDelete = () => {
        if (gameStatus !== "IN_PROGRESS") return;
        setCurrentGuess(currentGuess.slice(0, -1));
    };

    const triggerShake = () => {
        setShakeRow(true);
        setTimeout(() => setShakeRow(false), 400); // 0.4s matches CSS
    };

    const awardCoins = async (guess: string, evaluation: string[]) => {
        try {
            const res = await fetch('/api/reward', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guess, evaluation })
            });
            const data = await res.json();
            if (data.success && data.totalCoins !== undefined) {
                setCoins(data.totalCoins);
                if (data.coinsEarned > 0) {
                    showToast(`+${data.coinsEarned} monete!`);
                }
            }
        } catch (error) {
            console.error("Coin reward error", error);
        }
    };

    const buyHint = async () => {
        if (gameStatus !== "IN_PROGRESS") return;
        if (coins === null || coins < 100) {
            showToast("Monete insufficienti!");
            return;
        }

        setIsBuyingHint(true);
        try {
            const res = await fetch('/api/hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer, usedColors })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                setCoins(data.coins);
                setUsedColors(prev => ({
                    ...prev,
                    [data.hint]: 'PRESENT' // Reveal it in yellow on keyboard
                }));
                showToast(`Lettera scoperta: ${data.hint}`);
            } else {
                showToast(data.error || "Impossibile usare il suggerimento");
            }
        } catch (error) {
            console.error("Hint error", error);
        } finally {
            setIsBuyingHint(false);
        }
    };

    const onEnter = () => {
        if (gameStatus !== "IN_PROGRESS") return;
        if (currentGuess.length !== 5) {
            showToast(lang === 'it' ? "La parola deve essere di 5 lettere" : "The word must be 5 letters");
            triggerShake();
            return;
        }

        const activeDict = lang === 'it' ? WORDS_IT : WORDS_EN;
        if (!activeDict.includes(currentGuess)) {
            showToast(lang === 'it' ? "Parola non nel dizionario" : "Word not in dictionary");
            triggerShake();
            return;
        }

        const evaluation = evaluateGuess(currentGuess, answer);
        const newColors = updateUsedColors(usedColors, currentGuess, evaluation);

        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setUsedColors(newColors);
        setCurrentGuess("");

        let status: "IN_PROGRESS" | "WIN" | "FAIL" = "IN_PROGRESS";
        if (currentGuess === answer) status = "WIN";
        else if (newGuesses.length === 6) status = "FAIL";

        if (status !== "IN_PROGRESS") {
            setGameStatus(status);
            saveStats(status === "WIN", newGuesses.length);
            if (status === "WIN") {
                showToast(lang === 'it' ? 'Magnifico! Vittoria! +100 🪙' : 'Magnificent! Win! +100 🪙');
            }
        }
    };

    const saveStats = async (didWin: boolean, attempts: number) => {
        try {
            const res = await fetch('/api/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ didWin, attempts })
            });
            const data = await res.json();
            if (data.newTotalCoins !== undefined) {
                setCoins(data.newTotalCoins);
            }
        } catch (e) {
            console.error("Failed to save stats", e);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            if (e.key === 'Enter') {
                onEnter();
            } else if (e.key === 'Backspace') {
                onDelete();
            } else if (/^[A-Za-z]$/.test(e.key)) {
                onChar(e.key.toUpperCase());
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentGuess, gameStatus, answer, lang, usedColors, coins]); // Dependencies updated

    if (!answer) return <LoadingScreen />;

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>

            <Toaster message={toastMessage} onClose={() => { }} />

            {/* Top Bar — left (flex:1), center language (fixed), right (flex:1) */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: 'var(--board-gap)', flexShrink: 0, gap: '0.4rem' }}>

                {/* Left group: back + coins  — flex:1 so language stays centered */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', padding: '0.4rem 0.5rem', borderRadius: '20px', border: '3px solid var(--carrd-border)', fontWeight: 'bold', color: 'var(--carrd-border)' }}>
                        <button onClick={() => setShowConfirmHome(true)} style={{ display: 'flex', alignItems: 'center', color: 'var(--carrd-border)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                        <span style={{ width: '1px', height: '16px', background: 'var(--carrd-border)', opacity: 0.4 }} />
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FCD34D" stroke="#D97706" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="7" fill="#FBBF24" stroke="#D97706" strokeWidth="1"/>
                            <text x="12" y="16.5" fontSize="14" fill="#D97706" textAnchor="middle" fontWeight="900" fontFamily="sans-serif">W</text>
                        </svg>
                        {coins !== null ? coins : '...'}
                    </div>
                </div>

                {/* Center: language dropdown, truly centered */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <LanguageDropdown lang={lang} onChange={changeLanguage} />
                </div>

                {/* Right group: hint button — flex:1 justify end keeps it symmetric */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={buyHint}
                        disabled={isBuyingHint || gameStatus !== "IN_PROGRESS"}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'var(--secondary)', padding: '0.4rem 0.5rem',
                            borderRadius: '20px', border: '3px solid var(--carrd-border)',
                            fontWeight: 'bold', color: 'var(--carrd-border)', cursor: 'pointer',
                            opacity: (isBuyingHint || gameStatus !== "IN_PROGRESS") ? 0.5 : 1
                        }}
                        title="Compra un suggerimento (-100 monete)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/>
                            <path d="M9 18h6"/>
                            <path d="M10 22h4"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Confirm-home modal */}
            {showConfirmHome && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(168,129,125,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--carrd-bg)', border: '4px solid var(--carrd-border)', borderRadius: '24px', padding: '1.5rem', textAlign: 'center', maxWidth: '260px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--carrd-border)' }}>Tornare alla home?</div>
                        <div style={{ color: 'var(--foreground)', fontSize: '0.9rem' }}>La partita in corso andrà persa.</div>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'nowrap' }}>
                            <a href="/" style={{ background: 'var(--primary)', border: '3px solid var(--carrd-border)', borderRadius: '20px', padding: '0.45rem 1.2rem', fontWeight: '800', color: 'var(--carrd-border)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>Sì</a>
                            <button onClick={() => setShowConfirmHome(false)} style={{ background: 'var(--absent)', border: '3px solid var(--carrd-border)', borderRadius: '20px', padding: '0.45rem 1.2rem', fontWeight: '800', color: 'var(--carrd-border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Annulla</button>
                        </div>
                    </div>
                </div>
            )}

            <Board guesses={guesses} currentGuess={currentGuess} answer={answer} shakeRow={shakeRow} />

            {/* Compact win/fail banner — shrinks to avoid scroll */}
            {gameStatus === "WIN" && (
                <div style={{ margin: '0.3rem 0', padding: '0.4rem 1.2rem', background: 'var(--primary)', color: 'var(--key-text)', borderRadius: '16px', border: '2px solid var(--carrd-border)', fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'center', flexShrink: 0 }}>
                    {lang === 'it' ? 'Yayy! Hai vinto!' : 'Yayy! You won!'}
                </div>
            )}
            {gameStatus === "FAIL" && (
                <div style={{ margin: '0.3rem 0', padding: '0.4rem 1.2rem', background: 'var(--absent)', color: 'white', borderRadius: '16px', border: '2px solid var(--carrd-border)', fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'center', flexShrink: 0 }}>
                    {lang === 'it' ? `Oh no! La parola era ${answer}.` : `Oh no! The word was ${answer}.`}
                </div>
            )}

            <Keyboard onChar={onChar} onDelete={onDelete} onEnter={onEnter} usedColors={usedColors} />

            {gameStatus !== "IN_PROGRESS" && (
                <button
                    onClick={resetGame}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', padding: '0.5rem 1.2rem', background: 'var(--accent-pink)', color: 'white', border: '2px solid var(--carrd-border)', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', flexShrink: 0 }}>
                    {lang === 'it' ? 'Gioca Ancora' : 'Play Again'}
                </button>
            )}
        </div>
    );
}
