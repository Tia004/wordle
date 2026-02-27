"use client";

import { useState, useEffect } from "react";
import Board from "@/components/Board";
import Keyboard from "@/components/Keyboard";
import { WORDS, getRandomWord } from "@/lib/words";
import { evaluateGuess, updateUsedColors } from "@/lib/gameLogic";

export default function Play() {
    const [answer, setAnswer] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [usedColors, setUsedColors] = useState<Record<string, string>>({});
    const [gameStatus, setGameStatus] = useState<"IN_PROGRESS" | "WIN" | "FAIL">("IN_PROGRESS");

    useEffect(() => {
        // Scegli la parola segreta solo lato client al montaggio per evitare problemi di hydratation mismatch
        setAnswer(getRandomWord());
    }, []);

    // ... Decoratives inside render ...

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

    const onEnter = () => {
        if (gameStatus !== "IN_PROGRESS") return;
        if (currentGuess.length !== 5) {
            alert("La parola deve essere di 5 lettere");
            return;
        }

        if (!WORDS.includes(currentGuess)) {
            alert("Parola non nel dizionario");
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
        }
    };

    const saveStats = async (didWin: boolean, attempts: number) => {
        try {
            await fetch('/api/stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ didWin, attempts })
            });
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
    }, [currentGuess, gameStatus, answer]); // Include dependencies to ensure fresh state

    if (!answer) return <div>Caricamento...</div>;

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '1rem', maxWidth: '500px' }}>

            {/* Absolute floating decor */}
            <div style={{ position: 'absolute', top: '-30px', left: '-50px', fontSize: '2rem', transform: 'rotate(-10deg)' }}>✨🌸</div>
            <div style={{ position: 'absolute', top: '20px', right: '-40px', fontSize: '1.5rem', transform: 'rotate(15deg)' }}>⭐💖</div>
            <div style={{ position: 'absolute', bottom: '150px', left: '-60px', fontSize: '3rem' }}>🐈🪕🎵</div>
            <div style={{ position: 'absolute', bottom: '100px', right: '-50px', fontSize: '2rem' }}>☁️✨</div>

            <Board guesses={guesses} currentGuess={currentGuess} answer={answer} />

            {gameStatus === "WIN" && (
                <div style={{ marginBottom: '1rem', padding: '1rem 2rem', background: 'var(--primary)', color: 'var(--key-text)', borderRadius: '20px', border: '2px dashed var(--carrd-border)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center' }}>
                    Yayy! Hai vinto! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
                </div>
            )}
            {gameStatus === "FAIL" && (
                <div style={{ marginBottom: '1rem', padding: '1rem 2rem', background: 'var(--absent)', color: 'var(--key-text)', borderRadius: '20px', border: '2px dashed var(--carrd-border)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center' }}>
                    Oh nu! La parola era {answer}. (ಥ﹏ಥ)
                </div>
            )}

            <Keyboard onChar={onChar} onDelete={onDelete} onEnter={onEnter} usedColors={usedColors} />

            {gameStatus !== "IN_PROGRESS" && (
                <button
                    onClick={() => {
                        setAnswer(getRandomWord());
                        setGuesses([]);
                        setUsedColors({});
                        setGameStatus("IN_PROGRESS");
                    }}
                    style={{ marginTop: '2rem', padding: '0.8rem 2rem', background: 'var(--accent-pink)', color: 'white', border: '2px solid var(--carrd-border)', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: 'none' }}>
                    Gioca Ancora ♡
                </button>
            )}
        </div>
    );
}
