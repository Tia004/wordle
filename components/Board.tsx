import { evaluateGuess } from "@/lib/gameLogic";

export default function Board({ guesses, currentGuess, answer, shakeRow }: { guesses: string[], currentGuess: string, answer: string, shakeRow?: boolean }) {
    const empties = guesses.length < 6 ? Array(5 - guesses.length).fill('') : [];

    return (
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', gap: 'var(--board-gap)', marginBottom: '1rem', flexShrink: 1 }}>
            {/* Actual Game Rows */}
            {guesses.map((guess, i) => (
                <Row key={i} word={guess} submitted={true} answer={answer} rowIndex={i} />
            ))}
            {guesses.length < 6 && (
                <div className={shakeRow ? 'row-shake' : ''}>
                    <Row word={currentGuess} submitted={false} answer="" />
                </div>
            )}
            {empties.map((_, i) => (
                <Row key={`empty-${i}`} word="" submitted={false} answer="" />
            ))}
        </div>
    );
}

function Row({ word, submitted, answer, rowIndex = 0, overrideColors }: { word: string, submitted: boolean, answer: string, rowIndex?: number, overrideColors?: string[] }) {
    const letters = word.split('').concat(Array(5 - word.length).fill(''));
    const evaluation = submitted ? (overrideColors || evaluateGuess(word, answer)) : Array(5).fill('');

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--board-gap)' }}>
            {letters.map((letter, i) => {
                const isSubmitted = submitted;
                const status = overrideColors ? overrideColors[i] : evaluation[i];
                const bgClass = status === 'CORRECT' ? 'var(--primary)' :
                    status === 'PRESENT' ? 'var(--secondary)' :
                        status === 'ABSENT' ? 'var(--absent)' :
                            'white';

                return (
                    <div
                        key={i}
                        className={isSubmitted && letter !== '' ? 'tile-flip' : ''}
                        style={{
                            width: 'var(--board-tile-size)',
                            height: 'var(--board-tile-size)',
                            border: `3px solid ${isSubmitted ? bgClass : 'var(--carrd-border)'}`,
                            borderRadius: '16px', // Rounded squares for kawaii aesthetic
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            background: bgClass,
                            color: 'var(--key-text)',
                            boxShadow: 'none', // Strictly flat
                            animationDelay: isSubmitted ? `${i * 0.1}s` : '0s'
                        }}
                    >
                        {letter}
                    </div>
                );
            })}
        </div>
    );
}
