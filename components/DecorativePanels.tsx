export default function DecorativePanels() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '250px', flexShrink: 0 }}>
            {/* About Me Panel */}
            <div className="flat-border" style={{ padding: '1rem', background: 'var(--carrd-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h3 style={{ background: 'var(--carrd-header-bg)', color: 'var(--carrd-border)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '1rem', marginBottom: '1rem', border: '2px solid var(--carrd-border)' }}>
                    about me 🌸
                </h3>
                <div style={{ width: '80px', height: '80px', border: '3px dashed var(--accent-blue)', borderRadius: '50%', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem' }}>
                    🧸
                </div>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.4', color: 'var(--foreground)' }}>
                    Hii! (๑•̀ω•́)و <br />
                    I'm a cute pastel flat wordle game designed for you! ♡
                </p>
            </div>

            {/* Links Panel */}
            <div className="flat-border" style={{ padding: '1rem', background: 'var(--bg-check-2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ background: 'var(--accent-green)', color: 'var(--carrd-border)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '1rem', marginBottom: '1rem', border: '2px solid var(--carrd-border)' }}>
                    links 🍀
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    {['Portfolio', 'Twitter', 'Ko-fi'].map((link, i) => (
                        <div key={i} style={{ padding: '0.5rem', background: 'white', border: '2px solid var(--carrd-border)', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--carrd-border)', cursor: 'pointer' }}>
                            {link} 🎀
                        </div>
                    ))}
                </div>
            </div>

            {/* My Tools Panel */}
            <div className="flat-border" style={{ padding: '1rem', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ background: 'var(--bg-check-1)', color: 'var(--carrd-border)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '1rem', marginBottom: '1rem', border: '2px solid var(--carrd-border)' }}>
                    my tools ✏️
                </h3>
                <ul style={{ listStyleType: 'none', fontSize: '0.85rem', color: 'var(--foreground)', display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🖌️</span> Clip Studio Paint EX
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>📱</span> Huion Kamvas 16
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🍏</span> iPad Pro
                    </li>
                </ul>
            </div>
        </div>
    );
}
