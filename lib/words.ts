export const WORDS = [
    "MONDO", "CORSO", "TEMPO", "PORTA", "GATTO",
    "FIUME", "CIELO", "NOTTE", "CUORE", "AMORE",
    "TRENO", "FESTA", "CARTA", "PENNA", "VENTO",
    "MARE", "LUCE", "TERRA", "SOLE", "FUOCO",
    "NEVE", "ACQUA", "VERDE", "ROSSO", "GIALLO"
];

export function getRandomWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}
