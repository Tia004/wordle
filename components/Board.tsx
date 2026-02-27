import { evaluateGuess } from "@/lib/gameLogic";

export default function Board({ guesses, currentGuess, answer }: { guesses: string[], currentGuess: string, answer: string }) {
    const empties = guesses.length < 6 ? Array.from(Array(5 - guesses.length)) : [];

    return (
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(8, 1fr)', gap: '0.6rem', marginBottom: '2rem' }}>
            {/* Demo Rows as requested */}
            <Row word="MINTY" submitted={true} answer="MINTY" overrideColors={['CORRECT', 'CORRECT', 'CORRECT', 'CORRECT', 'PRESENT']} />
            <Row word="PEACH" submitted={true} answer="XEXXX" overrideColors={['PRESENT', 'ABSENT', 'ABSENT', 'ABSENT', 'ABSENT']} />

            {/* Divider */}
            <div style={{ height: '4px', background: 'var(--carrd-border)', borderRadius: '4px', margin: '0.5rem 0' }}></div>

            {/* Actual Game Rows */}
            {guesses.map((guess, i) => (
                <Row key={i} word={guess} submitted={true} answer={answer} />
            ))}
            {guesses.length < 6 && <Row word={currentGuess} submitted={false} answer={answer} />}
            {empties.map((_, i) => (
                <Row key={i + guesses.length + 1} word="" submitted={false} answer={answer} />
            ))}
        </div>
    );
}

function Row({ word, submitted, answer, overrideColors }: { word: string, submitted: boolean, answer: string, overrideColors?: string[] }) {
    const letters = word.split('');
    const empties = Array.from(Array(5 - letters.length));

    const evaluation = overrideColors || (submitted ? evaluateGuess(word, answer) : Array(5).fill(''));

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem' }}>
            {letters.map((char, i) => {
                const ev = evaluation[i];
                const bg = ev === 'CORRECT' ? 'var(--primary)' :
                    ev === 'PRESENT' ? 'var(--secondary)' :
                        ev === 'ABSENT' ? 'var(--absent)' : 'var(--key-bg)';

                // For Kawaii style, texts are always dark brown for legibility, no borders when empty, just soft background
                const color = 'var(--key-text)';
                const border = '2px solid var(--carrd-border)';

                return (
                    <div key={i} style={{
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        border,
                        background: bg,
                        color,
                        borderRadius: '12px', // Cute rounded squares
                        boxShadow: 'none' // Strictly flat
                    }}>
                        {char}
                    </div>
                );
            })}
            {empties.map((_, i) => (
                <div key={i + letters.length} style={{
                    width: '60px',
                    height: '60px',
                    border: '2px dashed var(--carrd-border)',
                    background: 'var(--carrd-bg)',
                    borderRadius: '12px'
                }} />
            ))}
        </div>
    );
}
