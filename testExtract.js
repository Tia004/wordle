const https = require("https");
https.get("https://raw.githubusercontent.com/par-le/gioco/main/src/constants/wordlist.ts", res => {
  let data = "";
  res.on("data", c => data += c);
  res.on("end", () => {
    const matches = Array.from(data.matchAll(/['"]([a-zA-Z]{5})['"]/g));
    const words = [...new Set(matches.map(m => m[1].toUpperCase()))];
    console.log("Answers:", words.length, words.slice(0, 5));
  });
});
