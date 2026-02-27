"use client";

import { useState, useEffect } from "react";
import Board from "@/components/Board";
import Keyboard from "@/components/Keyboard";
import LanguageDropdown from "@/components/LanguageDropdown";
import Toaster, { useToast } from "@/components/Toaster";
import LoadingScreen from "@/components/LoadingScreen";
import { WORDS_IT, WORDS_EN, getRandomWord } from "@/lib/words";
import { evaluateGuess, updateUsedColors } from "@/lib/gameLogic";

export default function Play() {
    const [lang, setLang] = useState<"it" | "en">("it");
    const [answer, setAnswer] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [usedColors, setUsedColors] = useState<Record<string, string>>({});
    const [gameStatus, setGameStatus] = useState<"IN_PROGRESS" | "WIN" | "FAIL">("IN_PROGRESS");
    const [coins, setCoins] = useState<number | null>(null);
    const [isBuyingHint, setIsBuyingHint] = useState(false);

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
            setLang(newLang);
            setAnswer(getRandomWord(newLang));
            setGuesses([]);
            setUsedColors({});
            setGameStatus("IN_PROGRESS");
            setCurrentGuess("");
        }
    };

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
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>

            <Toaster message={toastMessage} onClose={() => { }} />

            {/* Top Bar with Language Selector and Coins */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--board-gap)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.4rem 1rem', borderRadius: '20px', border: '3px solid var(--carrd-border)', fontWeight: 'bold', color: 'var(--carrd-border)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FCD34D" stroke="#D97706" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="7" fill="#FBBF24" stroke="#D97706" strokeWidth="1"></circle>
                        <text x="12" y="16.5" fontSize="14" fill="#D97706" textAnchor="middle" fontWeight="900" fontFamily="sans-serif">W</text>
                    </svg>
                    {coins !== null ? coins : '...'}
                </div>
                
                <LanguageDropdown lang={lang} onChange={changeLanguage} />
                
                <button 
                    onClick={buyHint}
                    disabled={isBuyingHint || gameStatus !== "IN_PROGRESS"}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', 
                        background: 'var(--secondary)', padding: '0.4rem 1rem', 
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

            <Board guesses={guesses} currentGuess={currentGuess} answer={answer} shakeRow={shakeRow} />

            {gameStatus === "WIN" && (
                <div style={{ marginBottom: '1rem', padding: '1rem 2rem', background: 'var(--primary)', color: 'var(--key-text)', borderRadius: '20px', border: '3px solid var(--carrd-border)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center' }}>
                    {lang === 'it' ? 'Yayy! Hai vinto!' : 'Yayy! You won!'}
                </div>
            )}
            {gameStatus === "FAIL" && (
                <div style={{ marginBottom: '1rem', padding: '1rem 2rem', background: 'var(--absent)', color: 'white', borderRadius: '20px', border: '3px solid var(--carrd-border)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center' }}>
                    {lang === 'it' ? `Oh no! La parola era ${answer}.` : `Oh no! The word was ${answer}.`}
                </div>
            )}

            <Keyboard onChar={onChar} onDelete={onDelete} onEnter={onEnter} usedColors={usedColors} />

            {gameStatus !== "IN_PROGRESS" && (
                <button
                    onClick={resetGame}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', padding: '0.8rem 2rem', background: 'var(--accent-pink)', color: 'white', border: '3px solid var(--carrd-border)', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: 'none' }}>
                    {lang === 'it' ? 'Gioca Ancora' : 'Play Again'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            )}
        </div>
    );
}
