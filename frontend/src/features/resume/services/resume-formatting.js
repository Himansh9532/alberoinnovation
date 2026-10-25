export function parseResumeContentLine(line, sectionKey = "") {
  const parts = [];
  const boldPattern = /\*\*([^*]+)\*\*|__([^_]+)__/g;
  let cursor = 0;
  let match;

  const addText = (text, bold = false) => {
    if (text) parts.push({ text, bold });
  };

  while ((match = boldPattern.exec(line))) {
    addText(line.slice(cursor, match.index));
    addText(match[1] || match[2], true);
    cursor = match.index + match[0].length;
  }
  addText(line.slice(cursor));

  if (sectionKey.toLowerCase().includes("skills") && !parts.some((part) => part.bold)) {
    const colonIndex = line.search(/[:：]/);
    if (colonIndex > 0 && colonIndex < 56) {
      return [
        { text: line.slice(0, colonIndex + 1), bold: true },
        { text: line.slice(colonIndex + 1) },
      ].filter((part) => part.text);
    }
  }

  return parts;
}
