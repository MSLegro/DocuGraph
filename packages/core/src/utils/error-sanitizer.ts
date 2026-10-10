/**
 * Cleans stderr / error stack traces from mmdc and Puppeteer,
 * extracting only clean, human-readable Mermaid syntax errors.
 */
export function sanitizeMermaidError(rawError: string): string {
  if (!rawError) {
    return 'Unknown diagram compilation error.';
  }

  const lines = rawError.split('\n').map(l => l.trim()).filter(Boolean);

  // Look for Mermaid parser error signatures
  const parseErrorIndex = lines.findIndex(l => 
    /parse error/i.test(l) || 
    /syntax error/i.test(l) || 
    /lexical error/i.test(l) ||
    /error: unknown diagram type/i.test(l) ||
    /no diagram type detected/i.test(l)
  );

  if (parseErrorIndex !== -1) {
    // Collect error description lines until stack trace lines start (e.g., "at ...")
    const cleanLines: string[] = [];
    for (let i = parseErrorIndex; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*at\s+/i.test(line) || /^\s*\(node:/i.test(line) || /^node:internal/i.test(line)) {
        break;
      }
      // Remove any prefix "Error: "
      cleanLines.push(line.replace(/^Error:\s*/i, ''));
    }

    if (cleanLines.length > 0) {
      return cleanLines.join('\n');
    }
  }

  // If there's an explicit "Error: <msg>", extract it
  const genericErrorMatch = rawError.match(/Error:\s*([^(\n\r]+)/i);
  if (genericErrorMatch && genericErrorMatch[1]) {
    const msg = genericErrorMatch[1].trim();
    if (!msg.toLowerCase().includes('evaluation failed') && !msg.toLowerCase().includes('puppeteer')) {
      return msg;
    }
  }

  // Filter out node_modules and chromium noise
  const filtered = lines.filter(l => 
    !l.includes('node_modules') &&
    !l.includes('puppeteer') &&
    !l.startsWith('at ') &&
    !l.startsWith('(node:') &&
    !l.includes('internal/process')
  );

  if (filtered.length > 0) {
    return filtered.slice(0, 3).join('\n');
  }

  return 'Diagram compilation failed due to a syntax error.';
}
