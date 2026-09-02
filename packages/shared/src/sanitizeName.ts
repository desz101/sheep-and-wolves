// Cleans a user-supplied display name into something safe to store and render
// everywhere it ends up: the lobby, the player ring, vote records, LiveKit
// participant identities, and server logs. Run this on the SERVER (it is the
// trust boundary) -- the client may run it too for instant feedback, but must
// never be relied on.

export const MAX_NAME_LENGTH = 24;

// Codepoint ranges a display name has no legitimate need for, but which let it
// hide content, reorder how neighbouring text renders, or smuggle control
// sequences into log lines and other consumers. Kept as data (not a literal
// regex) so this source file stays plain ASCII.
const UNSAFE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00, 0x1f], // C0 control codes
  [0x7f, 0x9f], // DEL + C1 control codes
  [0x200b, 0x200f], // zero-width space/joiner/non-joiner + LTR/RTL marks
  [0x202a, 0x202e], // bidi embedding / override
  [0x2028, 0x2029], // line / paragraph separators
  [0x2060, 0x2060], // word joiner
  [0x2066, 0x2069], // bidi isolates
  [0xfeff, 0xfeff], // BOM / zero-width no-break space
];

function stripUnsafe(input: string): string {
  let out = '';
  for (const ch of input) {
    const cp = ch.codePointAt(0) ?? 0;
    if (!UNSAFE_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi)) out += ch;
  }
  return out;
}

// A run of 2+ combining marks is "zalgo" text that spills over adjacent UI.
// A single mark (an ordinary accent, e.g. an acute or a diaeresis) is kept.
const STACKED_MARKS = /\p{M}{2,}/gu;

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
};

// Best-effort only: unambiguous slurs and a few strong terms. Deliberately
// excludes short words that are common substrings of innocent names
// (the "Scunthorpe problem"). Not an exhaustive moderation system.
const BANNED = [
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'kike',
  'chink',
  'tranny',
  'wetback',
  'rapist',
  'molest',
  'nazi',
  'hitler',
];

// A de-leeted, letters-only form: "N-1-G-G-3-R" and "n i g g e r" both fold to
// "nigger". Non-letters are dropped, so the length check below is what keeps a
// banned word from matching as an incidental substring of a longer real name.
function foldForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[013457@$]/g, (c) => LEET[c] ?? c)
    .replace(/[^a-z]/g, '');
}

export function containsBannedWord(name: string): boolean {
  const folded = foldForMatch(name);
  if (!folded) return false;
  // The whole name folds to a slur (plain, leetspeak, or letter-spaced),
  // allowing a couple of junk characters on the front like "xXfaggot".
  if (BANNED.some((w) => folded === w || (folded.startsWith(w) && folded.length <= w.length + 3))) {
    return true;
  }
  // ...or a slur stands alone as one word inside the name ("the faggot").
  // Keeps innocent words that merely contain a short slur as a substring
  // -- therapist, Scunthorpe, assassin, analysis -- from tripping it.
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some((tok) => BANNED.includes(foldForMatch(tok)));
}

/**
 * Returns the cleaned name, or '' when nothing usable is left (empty input, or
 * it tripped the word filter). Callers substitute a generated name for ''.
 */
export function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const cleaned = stripUnsafe(raw.normalize('NFC'))
    .replace(STACKED_MARKS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
  if (!cleaned || containsBannedWord(cleaned)) return '';
  return cleaned;
}
