import type { DiagramType } from '../types.js';

export function detectDiagramType(code: string): DiagramType {
  const cleanCode = code
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('%%'))
    .join('\n');

  if (/^(graph|flowchart)\b/i.test(cleanCode)) return 'flowchart';
  if (/^sequenceDiagram\b/i.test(cleanCode)) return 'sequence';
  if (/^classDiagram\b/i.test(cleanCode)) return 'class';
  if (/^stateDiagram(-v2)?\b/i.test(cleanCode)) return 'state';
  if (/^erDiagram\b/i.test(cleanCode)) return 'er';
  if (/^gantt\b/i.test(cleanCode)) return 'gantt';
  if (/^pie\b/i.test(cleanCode)) return 'pie';
  if (/^gitGraph\b/i.test(cleanCode)) return 'gitGraph';
  if (/^mindmap\b/i.test(cleanCode)) return 'mindmap';
  if (/^timeline\b/i.test(cleanCode)) return 'timeline';
  if (/^quadrantChart\b/i.test(cleanCode)) return 'quadrant';
  if (/^C4(Context|Container|Component|Dynamic|Deployment)\b/i.test(cleanCode)) return 'c4';
  if (/^sankey-beta\b/i.test(cleanCode)) return 'sankey';
  if (/^block-beta\b/i.test(cleanCode)) return 'block';

  return 'unknown';
}
