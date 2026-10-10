import fs from 'node:fs/promises';
import existsSync from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { CompileOptions, CompileResult, DiagramMeta, DiagramType } from '../types.js';
import { getStorageRoot, getPuppeteerConfigPath, findMonorepoRoot } from '../config.js';
import { runWithQueue } from '../utils/queue.js';
import { sanitizeMermaidError } from '../utils/error-sanitizer.js';
import { detectDiagramType } from '../utils/diagram-detector.js';

const execAsync = promisify(exec);

/**
 * Normalizes title into a safe filename/ID (slug).
 */
export function slugifyTitle(title: string): string {
  const clean = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9_-]+/g, '-')   // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '');        // trim leading/trailing hyphens

  return clean || `diagram-${Date.now()}`;
}

/**
 * Sanitizes relative folder paths preventing directory traversal attacks.
 */
export function sanitizeFolderPath(userPath: string = ''): string {
  const normalized = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return normalized.replace(/^[\/\\]+/, '').replace(/[\/\\]+$/, '');
}

export class DiagramService {
  private storageRoot: string;
  private puppeteerConfigPath: string;

  constructor(storageRoot?: string, puppeteerConfigPath?: string) {
    this.storageRoot = storageRoot || getStorageRoot();
    this.puppeteerConfigPath = puppeteerConfigPath || getPuppeteerConfigPath();
  }

  /**
   * Resolves target absolute path within storage root.
   */
  public resolveTargetDir(folderPath: string = ''): string {
    const safeRel = sanitizeFolderPath(folderPath);
    return path.join(this.storageRoot, safeRel);
  }

  /**
   * Compiles mermaid code and saves the triad (.mmd, .svg, .meta.json).
   */
  public async compileAndSave(options: CompileOptions): Promise<CompileResult> {
    const { title, code, folderPath = '' } = options;

    if (!title || !title.trim()) {
      return { success: false, error: 'Diagram title is required.' };
    }
    if (!code || !code.trim()) {
      return { success: false, error: 'Mermaid code is required.' };
    }

    const safeRelFolder = sanitizeFolderPath(folderPath);
    const targetDir = this.resolveTargetDir(safeRelFolder);
    await fs.mkdir(targetDir, { recursive: true });

    const id = slugifyTitle(title);
    const mmdPath = path.join(targetDir, `${id}.mmd`);
    const svgPath = path.join(targetDir, `${id}.svg`);
    const metaPath = path.join(targetDir, `${id}.meta.json`);

    // Check if existing metadata exists to preserve createdAt or theme
    let createdAt = new Date().toISOString();
    let theme = options.theme || 'dark';
    if (existsSync.existsSync(metaPath)) {
      try {
        const oldMetaRaw = await fs.readFile(metaPath, 'utf-8');
        const oldMeta = JSON.parse(oldMetaRaw) as DiagramMeta;
        if (oldMeta.createdAt) createdAt = oldMeta.createdAt;
        if (!options.theme && oldMeta.theme) theme = oldMeta.theme;
      } catch {
        // ignore corrupted old meta
      }
    }

    // Write source .mmd first
    await fs.writeFile(mmdPath, code, 'utf-8');

    // Run local mmdc compilation inside concurrency queue
    try {
      await runWithQueue(async () => {
        await this.executeMmdc(mmdPath, svgPath, theme);
      });

      // Read compiled SVG
      const svgContent = await fs.readFile(svgPath, 'utf-8');

      const diagramType = detectDiagramType(code);
      const isFavorite = Boolean(options.isFavorite);
      const meta: DiagramMeta = {
        id,
        title: title.trim(),
        folderPath: safeRelFolder,
        diagramType,
        theme,
        isFavorite,
        createdAt,
        updatedAt: new Date().toISOString()
      };

      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

      return {
        success: true,
        svgContent,
        meta
      };
    } catch (err: any) {
      // Clean up failed .svg or orphaned .mmd if compilation failed for new diagram
      try {
        if (existsSync.existsSync(svgPath)) {
          await fs.unlink(svgPath);
        }
        if (!existsSync.existsSync(metaPath) && existsSync.existsSync(mmdPath)) {
          await fs.unlink(mmdPath);
        }
      } catch {
        // ignore
      }

      const rawError = (err.stderr || err.stdout || err.message || '').toString();
      const cleanError = sanitizeMermaidError(rawError);

      return {
        success: false,
        error: cleanError
      };
    }
  }

  /**
   * Executes local mmdc command with custom theme.
   */
  private async executeMmdc(inputFile: string, outputFile: string, theme: string = 'dark'): Promise<void> {
    const root = findMonorepoRoot();
    
    // Check local node_modules/.bin path for mmdc
    const isWin = process.platform === 'win32';
    const binExt = isWin ? '.cmd' : '';
    
    // Look in root node_modules/.bin or package local
    const localBin = path.join(root, 'node_modules', '.bin', `mmdc${binExt}`);
    const coreBin = path.join(root, 'packages', 'core', 'node_modules', '.bin', `mmdc${binExt}`);
    
    let commandExecutable = 'pnpm exec mmdc';
    if (existsSync.existsSync(coreBin)) {
      commandExecutable = `"${coreBin}"`;
    } else if (existsSync.existsSync(localBin)) {
      commandExecutable = `"${localBin}"`;
    }

    const cmd = `${commandExecutable} -i "${inputFile}" -o "${outputFile}" -t "${theme}" -e svg -b transparent -p "${this.puppeteerConfigPath}"`;

    await execAsync(cmd, {
      cwd: root,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        PUPPETEER_DISABLE_HEADLESS_WARNING: 'true'
      }
    });
  }

  /**
   * Retrieves a diagram's triad content (.mmd, .svg, .meta.json).
   */
  public async getDiagram(folderPath: string, id: string): Promise<{
    meta: DiagramMeta;
    code: string;
    svgContent: string;
  } | null> {
    const safeRel = sanitizeFolderPath(folderPath);
    const targetDir = this.resolveTargetDir(safeRel);

    const mmdPath = path.join(targetDir, `${id}.mmd`);
    const svgPath = path.join(targetDir, `${id}.svg`);
    const metaPath = path.join(targetDir, `${id}.meta.json`);

    if (!existsSync.existsSync(metaPath) || !existsSync.existsSync(svgPath)) {
      return null;
    }

    const [metaRaw, code, svgContent] = await Promise.all([
      fs.readFile(metaPath, 'utf-8'),
      fs.readFile(mmdPath, 'utf-8').catch(() => ''),
      fs.readFile(svgPath, 'utf-8')
    ]);

    const meta = JSON.parse(metaRaw) as DiagramMeta;
    return { meta, code, svgContent };
  }

  /**
   * Deletes a diagram triad (.mmd, .svg, .meta.json).
   */
  public async deleteDiagram(folderPath: string, id: string): Promise<boolean> {
    const safeRel = sanitizeFolderPath(folderPath);
    const targetDir = this.resolveTargetDir(safeRel);

    const mmdPath = path.join(targetDir, `${id}.mmd`);
    const svgPath = path.join(targetDir, `${id}.svg`);
    const metaPath = path.join(targetDir, `${id}.meta.json`);

    const existed = existsSync.existsSync(metaPath) || existsSync.existsSync(svgPath) || existsSync.existsSync(mmdPath);
    if (!existed) return false;

    await Promise.all([
      fs.unlink(mmdPath).catch(() => {}),
      fs.unlink(svgPath).catch(() => {}),
      fs.unlink(metaPath).catch(() => {})
    ]);

    return true;
  }

  /**
   * Updates an existing diagram's title and/or code, compiling the new SVG.
   * Preserves original createdAt timestamp and cleans up old files if id changed.
   */
  public async updateDiagram(
    folderPath: string,
    currentId: string,
    options: { title: string; code: string; theme?: import('../types.js').MermaidTheme }
  ): Promise<CompileResult> {
    const safeRel = sanitizeFolderPath(folderPath);
    const targetDir = this.resolveTargetDir(safeRel);
    const currentMetaPath = path.join(targetDir, `${currentId}.meta.json`);

    let originalCreatedAt = new Date().toISOString();
    let originalIsFavorite = false;
    let currentTheme: import('../types.js').MermaidTheme | undefined = options.theme;
    if (existsSync.existsSync(currentMetaPath)) {
      try {
        const oldMetaRaw = await fs.readFile(currentMetaPath, 'utf-8');
        const oldMeta = JSON.parse(oldMetaRaw) as DiagramMeta;
        if (oldMeta.createdAt) originalCreatedAt = oldMeta.createdAt;
        if (oldMeta.isFavorite !== undefined) originalIsFavorite = Boolean(oldMeta.isFavorite);
        if (!currentTheme && oldMeta.theme) currentTheme = oldMeta.theme;
      } catch {
        // ignore
      }
    }

    const newId = slugifyTitle(options.title);

    // If ID changed (due to title rename), compile new one first
    const result = await this.compileAndSave({
      title: options.title,
      code: options.code,
      folderPath,
      theme: currentTheme,
      isFavorite: originalIsFavorite
    });

    if (!result.success) {
      return result;
    }

    // Preserve original createdAt and isFavorite
    if (result.meta) {
      result.meta.createdAt = originalCreatedAt;
      result.meta.isFavorite = originalIsFavorite;
      const newMetaPath = path.join(targetDir, `${newId}.meta.json`);
      await fs.writeFile(newMetaPath, JSON.stringify(result.meta, null, 2), 'utf-8');
    }

    // If ID changed, delete old files
    if (newId !== currentId) {
      await this.deleteDiagram(folderPath, currentId);
    }

    return result;
  }

  /**
   * Toggles the favorite status of a diagram.
   */
  public async toggleFavorite(
    folderPath: string,
    id: string
  ): Promise<{ success: boolean; isFavorite: boolean; meta?: DiagramMeta }> {
    const safeRel = sanitizeFolderPath(folderPath);
    const targetDir = this.resolveTargetDir(safeRel);
    const metaPath = path.join(targetDir, `${id}.meta.json`);

    if (!existsSync.existsSync(metaPath)) {
      throw new Error(`Diagram "${id}" not found in folder "${safeRel || 'root'}"`);
    }

    const metaRaw = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaRaw) as DiagramMeta;
    const newFavorite = !Boolean(meta.isFavorite);
    meta.isFavorite = newFavorite;
    meta.updatedAt = new Date().toISOString();

    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

    return {
      success: true,
      isFavorite: newFavorite,
      meta
    };
  }
}


