const INLINE_LINK_RE = /\[([^\]]+)\]\((\/[^)]+)\)/g;

export type LegalInlinePart =
  | { kind: "text"; value: string }
  | { kind: "link"; label: string; href: string };

export function parseLegalInlineMarkdown(text: string): LegalInlinePart[] {
  const parts: LegalInlinePart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_LINK_RE.lastIndex = 0;
  while ((match = INLINE_LINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ kind: "link", label: match[1]!, href: match[2]! });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ kind: "text", value: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ kind: "text", value: text });
  }

  return parts;
}
