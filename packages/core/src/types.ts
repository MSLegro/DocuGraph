export type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'gantt'
  | 'pie'
  | 'gitGraph'
  | 'mindmap'
  | 'timeline'
  | 'quadrant'
  | 'c4'
  | 'sankey'
  | 'block'
  | 'unknown';

export type MermaidTheme = 'dark' | 'default' | 'neutral' | 'forest' | 'base';

export interface DiagramMeta {
  id: string;
  title: string;
  folderPath: string;
  diagramType: DiagramType;
  theme?: MermaidTheme;
  createdAt: string;
  updatedAt: string;
}

export interface CompileOptions {
  title: string;
  code: string;
  folderPath?: string;
  theme?: MermaidTheme;
}

export interface CompileResult {
  success: boolean;
  svgContent?: string;
  meta?: DiagramMeta;
  error?: string;
}

export interface DiagramItem {
  id: string;
  title: string;
  folderPath: string;
  diagramType: DiagramType;
  theme?: MermaidTheme;
  createdAt: string;
  updatedAt: string;
  svgContent?: string;
}

export interface FolderItem {
  name: string;
  relativePath: string;
  diagramCount: number;
}

export interface TreeResponse {
  currentFolder: string;
  breadcrumbs: Array<{ name: string; path: string }>;
  folders: FolderItem[];
  diagrams: DiagramItem[];
}
