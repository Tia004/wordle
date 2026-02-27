export default function Keyboard({ onChar, onDelete, onEnter, usedColors }: { onChar: (char: string) => void, onDelete: () => void, onEnter: () => void, usedColors: Record<string, string> }) {
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--key-gap)', width: '100%', maxWidth: '500px', margin: '0 auto', flexShrink: 0 }}>
            {rows.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: 'var(--key-gap)', flexShrink: 0 }}>
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
                                    height: 'var(--key-height)',
                                    minWidth: 0, // Allows aggressive shrinking below text size
                                    borderRadius: '16px', // Extra rounded for bubble feel
                                    border: '2px solid var(--carrd-border)',
                                    background: bgClass,
                                    color: textColor,
                                    fontWeight: 'bold',
                                    fontSize: isAction ? 'var(--key-action-font-size)' : 'var(--key-font-size)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: 'var(--key-padding)',
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
