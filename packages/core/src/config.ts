import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const getCurrentDir = (): string => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  return path.dirname(fileURLToPath(import.meta.url));
};

const currentDir = getCurrentDir();

/**
 * Finds the monorepo root directory by looking for pnpm-workspace.yaml upwards.
 */
export function findMonorepoRoot(startDir: string = process.cwd()): string {
  let current = startDir;
  while (true) {
    if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      // Reached filesystem root, fallback to current working directory
      return process.cwd();
    }
    current = parent;
  }
}

export function getStorageRoot(): string {
  if (process.env.DOCUGRAPH_STORAGE_ROOT) {
    return path.resolve(process.env.DOCUGRAPH_STORAGE_ROOT);
  }
  const root = path.resolve(findMonorepoRoot(currentDir));
  return path.resolve(root, 'storage', 'projects', 'default');
}

export function getPuppeteerConfigPath(): string {
  const root = path.resolve(findMonorepoRoot(currentDir));
  return path.resolve(root, 'packages', 'core', 'puppeteer-config.json');
}
