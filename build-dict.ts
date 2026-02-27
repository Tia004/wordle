import fs from 'fs';
import https from 'https';
import path from 'path';

const IT_URL_ANSWERS = 'https://raw.githubusercontent.com/napolux/paroleitaliane/main/paroleitaliane/60000_parole_italiane.txt';
const IT_URL_GUESSES = 'https://raw.githubusercontent.com/napolux/paroleitaliane/main/paroleitaliane/parole_uniche.txt';
const EN_URL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';

const fetchFile = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
};

const filterWords = (data: string): string[] => {
    const lines = data.split(/\r?\n/);
    const words = lines
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length === 5 && /^[A-Z]{5}$/.test(w));

    // Deduplicate
    return Array.from(new Set(words));
};

async function main() {
    console.log('Fetching Italian answers...');
    const itAnswersData = await fetchFile(IT_URL_ANSWERS);
    const itAnswers = filterWords(itAnswersData);
    console.log(`Found ${itAnswers.length} Italian 5-letter answer words.`);

    console.log('Fetching Italian guesses...');
    const itGuessesData = await fetchFile(IT_URL_GUESSES);
    const itGuesses = filterWords(itGuessesData);
    console.log(`Found ${itGuesses.length} Italian 5-letter valid guess words.`);

    console.log('Fetching English words...');
    const enData = await fetchFile(EN_URL);
    const enWords = filterWords(enData);
    console.log(`Found ${enWords.length} English 5-letter words.`);

    const tsContent = `// Auto-generated dictionaries

export const WORDS_IT = ${JSON.stringify(itAnswers, null, 2)};

export const WORDS_IT_GUESSES = ${JSON.stringify(itGuesses, null, 2)};

export const WORDS_EN = ${JSON.stringify(enWords, null, 2)};

export const getRandomWord = (lang: 'it' | 'en') => {
    const list = lang === 'it' ? WORDS_IT : WORDS_EN;
    return list[Math.floor(Math.random() * list.length)];
};
`;

    fs.writeFileSync(path.join(process.cwd(), 'lib/words.ts'), tsContent);
    console.log('Successfully wrote words to lib/words.ts');
}

main().catch(console.error);
