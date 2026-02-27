export default function Keyboard({ onChar, onDelete, onEnter, usedColors }: { onChar: (char: string) => void, onDelete: () => void, onEnter: () => void, usedColors: Record<string, string> }) {
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            {rows.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                    {row.map(key => {
                        const bgClass = usedColors[key] === 'CORRECT' ? 'var(--primary)' :
                            usedColors[key] === 'PRESENT' ? 'var(--secondary)' :
                                usedColors[key] === 'ABSENT' ? 'var(--absent)' :
                                    'var(--key-bg)';

                        // Text color is always dark brown for legibility in this kawaii style
                        const textColor = 'var(--key-text)';
                        const isAction = key === 'ENTER' || key === 'DEL';

                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    if (key === 'ENTER') onEnter();
                                    else if (key === 'DEL') onDelete();
                                    else onChar(key);
                                }}
                                style={{
                                    flex: isAction ? 1.5 : 1,
                                    height: '58px',
                                    borderRadius: '16px', // Extra rounded for bubble feel
                                    border: '2px solid var(--carrd-border)',
                                    background: bgClass,
                                    color: textColor,
                                    fontWeight: 'bold',
                                    fontSize: isAction ? '1rem' : '1.2rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '0 0.5rem',
                                    boxShadow: 'none' // Strictly flat
                                }}
                            >
                                {key === 'ENTER' ? 'ENTER' : key === 'DEL' ? 'DEL' : key}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
