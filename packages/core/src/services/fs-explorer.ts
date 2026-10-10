import fs from 'node:fs/promises';
import existsSync from 'node:fs';
import path from 'node:path';
import type { FolderItem, DiagramItem, TreeResponse, DiagramMeta, FavoritesResponse } from '../types.js';
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
   * Renames an existing folder safely within storage root.
   */
  public async renameFolder(currentRelPath: string, newFolderName: string): Promise<string> {
    const safeCurrent = sanitizeFolderPath(currentRelPath);
    if (!safeCurrent) {
      throw new Error('Cannot rename root directory');
    }

    const cleanNewName = newFolderName
      .trim()
      .replace(/[\/\\:*?"<>|]/g, '-')
      .replace(/^\.+/, '');

    if (!cleanNewName) {
      throw new Error('Invalid folder name');
    }

    const sourceAbs = path.join(this.storageRoot, safeCurrent);
    if (!existsSync.existsSync(sourceAbs)) {
      throw new Error(`Folder "${safeCurrent}" does not exist`);
    }

    const parentRel = path.dirname(safeCurrent);
    const safeParentRel = parentRel === '.' ? '' : sanitizeFolderPath(parentRel);
    const targetAbs = path.join(this.storageRoot, safeParentRel, cleanNewName);

    if (existsSync.existsSync(targetAbs)) {
      throw new Error(`A folder named "${cleanNewName}" already exists`);
    }

    await fs.rename(sourceAbs, targetAbs);
    return safeParentRel ? `${safeParentRel}/${cleanNewName}` : cleanNewName;
  }

  /**
   * Deletes a folder recursively from storage root.
   */
  public async deleteFolder(relativeFolderPath: string): Promise<boolean> {
    const safeRel = sanitizeFolderPath(relativeFolderPath);
    if (!safeRel) {
      throw new Error('Cannot delete root directory');
    }

    const targetAbs = path.join(this.storageRoot, safeRel);
    if (!existsSync.existsSync(targetAbs)) {
      return false;
    }

    await fs.rm(targetAbs, { recursive: true, force: true });
    return true;
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

        // Check if folder is marked favorite
        let isFavorite = false;
        const folderMetaPath = path.join(subDirPath, '.folder.json');
        if (existsSync.existsSync(folderMetaPath)) {
          try {
            const fMetaRaw = await fs.readFile(folderMetaPath, 'utf-8');
            isFavorite = Boolean(JSON.parse(fMetaRaw).isFavorite);
          } catch {
            // ignore
          }
        }

        folders.push({
          name: entry.name,
          relativePath: folderRelPath,
          diagramCount: count,
          isFavorite
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
            theme: meta.theme || 'dark',
            isFavorite: Boolean(meta.isFavorite),
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

  /**
   * Toggles favorite status of a folder.
   */
  public async toggleFolderFavorite(
    relativeFolderPath: string
  ): Promise<{ success: boolean; isFavorite: boolean }> {
    const safeRel = sanitizeFolderPath(relativeFolderPath);
    if (!safeRel) {
      throw new Error('Cannot toggle favorite on root directory');
    }

    const folderAbs = path.join(this.storageRoot, safeRel);
    if (!existsSync.existsSync(folderAbs)) {
      throw new Error(`Folder "${safeRel}" does not exist`);
    }

    const folderMetaPath = path.join(folderAbs, '.folder.json');
    let currentFavorite = false;
    if (existsSync.existsSync(folderMetaPath)) {
      try {
        const raw = await fs.readFile(folderMetaPath, 'utf-8');
        currentFavorite = Boolean(JSON.parse(raw).isFavorite);
      } catch {
        // ignore
      }
    }

    const newFavorite = !currentFavorite;
    await fs.writeFile(
      folderMetaPath,
      JSON.stringify({ isFavorite: newFavorite, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );

    return {
      success: true,
      isFavorite: newFavorite
    };
  }

  /**
   * Recursively discovers all favorited folders and diagrams in storage.
   */
  public async getAllFavorites(): Promise<FavoritesResponse> {
    await this.ensureStorageRoot();
    const favoriteFolders: FolderItem[] = [];
    const favoriteDiagrams: DiagramItem[] = [];

    const traverse = async (currentRel: string) => {
      const currentAbs = path.join(this.storageRoot, currentRel);
      if (!existsSync.existsSync(currentAbs)) return;

      const entries = await fs.readdir(currentAbs, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name.startsWith('.')) continue;

          const subRel = currentRel ? `${currentRel}/${entry.name}` : entry.name;
          const subAbs = path.join(currentAbs, entry.name);

          // Check folder favorite
          const folderMetaPath = path.join(subAbs, '.folder.json');
          let isFolderFav = false;
          if (existsSync.existsSync(folderMetaPath)) {
            try {
              const raw = await fs.readFile(folderMetaPath, 'utf-8');
              isFolderFav = Boolean(JSON.parse(raw).isFavorite);
            } catch {}
          }

          let count = 0;
          try {
            const subEntries = await fs.readdir(subAbs);
            count = subEntries.filter(f => f.endsWith('.meta.json')).length;
          } catch {}

          if (isFolderFav) {
            favoriteFolders.push({
              name: entry.name,
              relativePath: subRel,
              diagramCount: count,
              isFavorite: true
            });
          }

          await traverse(subRel);
        } else if (entry.isFile() && entry.name.endsWith('.meta.json')) {
          const id = entry.name.replace(/\.meta\.json$/, '');
          const metaPath = path.join(currentAbs, entry.name);
          const svgPath = path.join(currentAbs, `${id}.svg`);

          try {
            const metaRaw = await fs.readFile(metaPath, 'utf-8');
            const meta = JSON.parse(metaRaw) as DiagramMeta;

            if (meta.isFavorite) {
              let svgContent: string | undefined;
              if (existsSync.existsSync(svgPath)) {
                svgContent = await fs.readFile(svgPath, 'utf-8');
              }

              favoriteDiagrams.push({
                id: meta.id || id,
                title: meta.title || id,
                folderPath: currentRel,
                diagramType: meta.diagramType || 'flowchart',
                theme: meta.theme || 'dark',
                isFavorite: true,
                createdAt: meta.createdAt || new Date().toISOString(),
                updatedAt: meta.updatedAt || new Date().toISOString(),
                svgContent
              });
            }
          } catch {}
        }
      }
    };

    await traverse('');

    favoriteFolders.sort((a, b) => a.name.localeCompare(b.name));
    favoriteDiagrams.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return {
      folders: favoriteFolders,
      diagrams: favoriteDiagrams
    };
  }
}
