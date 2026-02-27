import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
    value: string | number;
    options: { value: string | number; label: React.ReactNode }[];
    onChange: (val: any) => void;
}

export default function CustomSelect({ value, options, onChange }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', minWidth: '140px' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '0.4rem 0.8rem', 
                    borderRadius: '12px', 
                    border: '3px solid var(--carrd-border)', 
                    fontFamily: 'inherit', 
                    fontWeight: 'bold', 
                    color: 'var(--carrd-border)', 
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                }}
            >
                <span>{selectedOption?.label}</span>
                <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'white',
                    border: '3px solid var(--carrd-border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    zIndex: 10,
                }}>
                    {options.map((opt, i) => (
                        <div 
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            onMouseEnter={(e) => {
                                if (opt.value !== value) {
                                    e.currentTarget.style.background = 'var(--secondary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (opt.value !== value) {
                                    e.currentTarget.style.background = 'white';
                                }
                            }}
                            style={{
                                padding: '0.5rem 0.8rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                color: opt.value === value ? 'white' : 'var(--carrd-border)',
                                background: opt.value === value ? 'var(--primary)' : 'white',
                                borderBottom: i < options.length - 1 ? '2px solid var(--carrd-border)' : 'none',
                                transition: 'background 0.2s',
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
