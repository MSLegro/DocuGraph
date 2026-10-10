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

export type CanvasBgTheme =
  | 'dark-grid'
  | 'light-grid'
  | 'blueprint'
  | 'neutral'
  | 'pure-white'
  | 'pure-black';

export type AppTheme = 'dark-tokyo' | 'dark-slate' | 'light-slate';

export interface DiagramMeta {
  id: string;
  title: string;
  folderPath: string;
  diagramType: DiagramType;
  theme?: MermaidTheme;
  createdAt: string;
  updatedAt: string;
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

export interface CompileResult {
  success: boolean;
  meta?: DiagramMeta;
  svgContent?: string;
  error?: string;
}

export interface DiagramContentResponse {
  meta: DiagramMeta;
  code: string;
  svgContent: string;
}
