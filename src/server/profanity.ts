const PHRASES = ["kill yourself", "kys"];

const TOKENS = [
  "fuck",
  "fucker",
  "fucking",
  "motherfucker",
  "shithead",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "retarded",
  "tranny",
  "kike",
  "spic",
  "chink",
  "wetback",
  "beaner",
];

function normalize(input: string): { spaced: string; collapsed: string } {
  const mapped = input
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
  const spaced = mapped.replace(/[^a-z]+/g, " ").replace(/\s+/g, " ").trim();
  return { spaced: ` ${spaced} `, collapsed: spaced.replace(/ /g, "") };
}

export function containsBlockedLanguage(input: string): boolean {
  if (!input.trim()) return false;
  const { spaced, collapsed } = normalize(input);
  for (const phrase of PHRASES) {
    if (spaced.includes(` ${phrase} `) || collapsed.includes(phrase.replace(/ /g, ""))) return true;
  }
  for (const token of TOKENS) {
    if (spaced.includes(` ${token} `) || collapsed.includes(token)) return true;
  }
  return false;
}
