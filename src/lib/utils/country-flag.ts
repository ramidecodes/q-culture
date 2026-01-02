/**
 * Converts an ISO country code to a flag emoji.
 * Uses the Unicode regional indicator symbols.
 */
export function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length !== 2) {
    return "🏳️";
  }

  const codePoints = isoCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
