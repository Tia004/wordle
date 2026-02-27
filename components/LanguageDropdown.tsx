"use client";

import { useState, useRef, useEffect } from "react";

type LanguageDropdownProps = {
    lang: "it" | "en";
    onChange: (newLang: "it" | "en") => void;
};

export default function LanguageDropdown({ lang, onChange }: LanguageDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDownDescendantContext = (e: KeyboardEvent) => {
            // Prevent keys like "i" or "e" from triggering anything when dropdown is somewhat focused
            // Only explicitly handle clicks or Enter on the dropdown items
            if (isOpen) {
                e.preventDefault();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (selected: "it" | "en") => {
        onChange(selected);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', zIndex: 10 }}>
            {/* Toggle Button */}
            <div
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    background: 'white',
                    padding: '0.4rem 1.2rem',
                    borderRadius: '20px',
                    border: '3px solid var(--carrd-border)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    userSelect: 'none',
                    boxShadow: isOpen ? '0 0 0 3px var(--accent-pink)' : 'none',
                    transition: 'all 0.2s ease'
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                </span>
                <span style={{ color: 'var(--carrd-border)', fontSize: '1rem', fontWeight: 'bold' }}>
                    {lang === 'it' ? 'Italiano' : 'English'}
                </span>
                <span style={{
                    fontSize: '0.8rem',
                    color: 'var(--carrd-border)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                }}>▼</span>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--carrd-bg)',
                    border: '3px solid var(--carrd-border)',
                    borderRadius: '16px',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                    width: '140px',
                    animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <div
                        onClick={(e) => { e.stopPropagation(); handleSelect('it'); }}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '10px',
                            background: lang === 'it' ? 'var(--accent-pink)' : 'transparent',
                            color: lang === 'it' ? 'white' : 'var(--carrd-border)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { if (lang !== 'it') e.currentTarget.style.background = 'rgba(255, 183, 195, 0.3)'; }}
                        onMouseLeave={(e) => { if (lang !== 'it') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <svg width="18" height="14" viewBox="0 0 3 2" style={{ borderRadius: '2px' }}>
                            <rect width="1" height="2" fill="#009246" />
                            <rect x="1" width="1" height="2" fill="#fff" />
                            <rect x="2" width="1" height="2" fill="#ce2b37" />
                        </svg>
                        Italiano
                    </div>

                    <div
                        onClick={(e) => { e.stopPropagation(); handleSelect('en'); }}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '10px',
                            background: lang === 'en' ? 'var(--accent-pink)' : 'transparent',
                            color: lang === 'en' ? 'white' : 'var(--carrd-border)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { if (lang !== 'en') e.currentTarget.style.background = 'rgba(255, 183, 195, 0.3)'; }}
                        onMouseLeave={(e) => { if (lang !== 'en') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="18" height="14" style={{ borderRadius: '2px', overflow: 'hidden' }}>
                            <rect width="60" height="30" fill="#012169" />
                            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                            <path d="M0,0 L25,12.5 M60,30 L35,17.5 M60,0 L35,12.5 M0,30 L25,17.5" stroke="#C8102E" strokeWidth="4" />
                            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                        </svg>
                        English
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes popIn {
                    0% { opacity: 0; transform: translateX(-50%) scale(0.9) translateY(-10px); }
                    100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
