/**
 * Sanitizes and normalizes Mermaid SVG code so it fits tightly
 * to its bounding box in previewers and canvas without extra whitespace.
 */
export function normalizeSvg(rawSvg: string): string {
  if (!rawSvg) return '';

  let svg = rawSvg;

  // Replace or inject preserveAspectRatio="xMidYMid meet"
  if (!/preserveAspectRatio=/i.test(svg)) {
    svg = svg.replace(/<svg\b/i, '<svg preserveAspectRatio="xMidYMid meet"');
  }

  // Remove fixed inline max-width or width/height styles that cause whitespace gaps
  svg = svg.replace(/style="([^"]*)"/i, (match, styles) => {
    const cleaned = styles
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => 
        !s.startsWith('max-width') && 
        !s.startsWith('width') && 
        !s.startsWith('height')
      )
      .join('; ');
    return `style="${cleaned}; width: 100%; height: 100%; display: block;"`;
  });

  // Ensure svg tag has width="100%" and height="100%"
  if (/<svg\b[^>]*\bwidth=/i.test(svg)) {
    svg = svg.replace(/\bwidth="[^"]*"/i, 'width="100%"');
  } else {
    svg = svg.replace(/<svg\b/i, '<svg width="100%"');
  }

  if (/<svg\b[^>]*\bheight=/i.test(svg)) {
    svg = svg.replace(/\bheight="[^"]*"/i, 'height="100%"');
  } else {
    svg = svg.replace(/<svg\b/i, '<svg height="100%"');
  }

  return svg;
}
