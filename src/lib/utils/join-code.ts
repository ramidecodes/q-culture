/**
 * Generates a random 6-character alphanumeric join code.
 * Uses uppercase letters and numbers (A-Z, 0-9).
 *
 * @returns A 6-character uppercase alphanumeric string
 */
export function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
