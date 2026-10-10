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

export type DiagramTheme = 'dark' | 'default' | 'neutral' | 'forest' | 'base';
export type MermaidTheme = DiagramTheme;

export interface DiagramMeta {
  id: string;
  title: string;
  folderPath: string;
  diagramType: DiagramType;
  theme?: MermaidTheme;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompileOptions {
  title: string;
  code: string;
  folderPath?: string;
  theme?: MermaidTheme;
  isFavorite?: boolean;
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
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  svgContent?: string;
}

export interface FolderItem {
  name: string;
  relativePath: string;
  diagramCount: number;
  isFavorite?: boolean;
}

export interface TreeResponse {
  currentFolder: string;
  breadcrumbs: Array<{ name: string; path: string }>;
  folders: FolderItem[];
  diagrams: DiagramItem[];
}

export interface FavoritesResponse {
  folders: FolderItem[];
  diagrams: DiagramItem[];
}

