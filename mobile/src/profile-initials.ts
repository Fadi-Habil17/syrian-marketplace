export function profileInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = (word: string) => Array.from(word.normalize('NFC').replace(/\p{M}/gu, ''));
  return (
    (words.length > 1
      ? (letters(words[0]!)[0] ?? '') + (letters(words.at(-1)!)[0] ?? '')
      : letters(words[0] ?? '')
          .slice(0, 2)
          .join('')
    ).toUpperCase() || '?'
  );
}
