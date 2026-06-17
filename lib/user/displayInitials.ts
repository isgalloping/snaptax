export function displayInitials(name: string, email: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return (tokens[0]![0]! + tokens[1]![0]!).toUpperCase();
  }
  if (tokens.length === 1) {
    return tokens[0]![0]!.toUpperCase();
  }
  const fallback = email.trim()[0];
  return fallback ? fallback.toUpperCase() : "?";
}
