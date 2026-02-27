export function evaluateGuess(guess: string, answer: string) {
    const result: ('CORRECT' | 'PRESENT' | 'ABSENT' | '')[] = Array(5).fill('');
    const answerLetters = answer.split('');
    const guessLetters = guess.split('');

    // First pass: mark correct ones
    guessLetters.forEach((letter, i) => {
        if (letter === answerLetters[i]) {
            result[i] = 'CORRECT';
            answerLetters[i] = ''; // mark as used
        }
    });

    // Second pass: mark present ones
    guessLetters.forEach((letter, i) => {
        if (result[i] !== 'CORRECT' && answerLetters.includes(letter)) {
            result[i] = 'PRESENT';
            answerLetters[answerLetters.indexOf(letter)] = ''; // mark as used
        } else if (result[i] === '') {
            result[i] = 'ABSENT';
        }
    });

    return result;
}

export function updateUsedColors(currentUsed: Record<string, string>, guess: string, evaluation: ('CORRECT' | 'PRESENT' | 'ABSENT' | '')[]) {
    const newUsed = { ...currentUsed };
    guess.split('').forEach((letter, i) => {
        const ev = evaluation[i];
        if (ev === 'CORRECT') newUsed[letter] = 'CORRECT';
        else if (ev === 'PRESENT' && newUsed[letter] !== 'CORRECT') newUsed[letter] = 'PRESENT';
        else if (ev === 'ABSENT' && !newUsed[letter]) newUsed[letter] = 'ABSENT';
    });
    return newUsed;
}
