import fs from 'node:fs/promises';
import existsSync from 'node:fs';
import path from 'node:path';
import type { FolderItem, DiagramItem, TreeResponse, DiagramMeta } from '../types.js';
import { getStorageRoot } from '../config.js';
import { sanitizeFolderPath } from './diagram-service.js';

export class FileSystemExplorer {
  private storageRoot: string;

  constructor(storageRoot?: string) {
    this.storageRoot = storageRoot || getStorageRoot();
  }

  /**
   * Ensures storage root directory exists.
   */
  public async ensureStorageRoot(): Promise<void> {
    await fs.mkdir(this.storageRoot, { recursive: true });
  }

  /**
   * Creates a subfolder safely within relative path.
   */
  public async createFolder(parentFolder: string = '', folderName: string): Promise<string> {
    const safeParent = sanitizeFolderPath(parentFolder);
    const cleanFolderName = folderName
      .trim()
      .replace(/[\/\\:*?"<>|]/g, '-')
      .replace(/^\.+/, '');

    if (!cleanFolderName) {
      throw new Error('Invalid folder name');
    }

    const fullPath = path.join(this.storageRoot, safeParent, cleanFolderName);
    await fs.mkdir(fullPath, { recursive: true });

    return safeParent ? `${safeParent}/${cleanFolderName}` : cleanFolderName;
  }

  /**
   * Lists folders and diagrams inside a relative folder.
   */
  public async listFilesAndFolders(relativePath: string = ''): Promise<TreeResponse> {
    await this.ensureStorageRoot();

    const safeRel = sanitizeFolderPath(relativePath);
    const currentAbsDir = path.join(this.storageRoot, safeRel);

    if (!existsSync.existsSync(currentAbsDir)) {
      await fs.mkdir(currentAbsDir, { recursive: true });
    }

    const entries = await fs.readdir(currentAbsDir, { withFileTypes: true });

    const folders: FolderItem[] = [];
    const diagrams: DiagramItem[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderRelPath = safeRel ? `${safeRel}/${entry.name}` : entry.name;
        const subDirPath = path.join(currentAbsDir, entry.name);
        
        // Count diagrams in this subfolder
        let count = 0;
        try {
          const subEntries = await fs.readdir(subDirPath);
          count = subEntries.filter(f => f.endsWith('.meta.json')).length;
        } catch {
          count = 0;
        }

        folders.push({
          name: entry.name,
          relativePath: folderRelPath,
          diagramCount: count
        });
      } else if (entry.isFile() && entry.name.endsWith('.meta.json')) {
        const id = entry.name.replace(/\.meta\.json$/, '');
        const metaPath = path.join(currentAbsDir, entry.name);
        const svgPath = path.join(currentAbsDir, `${id}.svg`);

        try {
          const metaRaw = await fs.readFile(metaPath, 'utf-8');
          const meta = JSON.parse(metaRaw) as DiagramMeta;

          let svgContent: string | undefined;
          if (existsSync.existsSync(svgPath)) {
            svgContent = await fs.readFile(svgPath, 'utf-8');
          }

          diagrams.push({
            id: meta.id || id,
            title: meta.title || id,
            folderPath: safeRel,
            diagramType: meta.diagramType || 'flowchart',
            createdAt: meta.createdAt || new Date().toISOString(),
            updatedAt: meta.updatedAt || new Date().toISOString(),
            svgContent
          });
        } catch {
          // ignore invalid json
        }
      }
    }

    // Sort folders alphabetically, diagrams by updatedAt desc
    folders.sort((a, b) => a.name.localeCompare(b.name));
    diagrams.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Build breadcrumbs
    const breadcrumbs: Array<{ name: string; path: string }> = [
      { name: 'Root', path: '' }
    ];

    if (safeRel) {
      const parts = safeRel.split(/[\/\\]+/).filter(Boolean);
      let accumulated = '';
      for (const part of parts) {
        accumulated = accumulated ? `${accumulated}/${part}` : part;
        breadcrumbs.push({ name: part, path: accumulated });
      }
    }

    return {
      currentFolder: safeRel,
      breadcrumbs,
      folders,
      diagrams
    };
  }
}
