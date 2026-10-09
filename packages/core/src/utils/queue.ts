import pLimit from 'p-limit';

// Limit maximum concurrent mmdc/Puppeteer instances to 2 to protect CPU/RAM
export const compileQueue = pLimit(2);

export async function runWithQueue<T>(fn: () => Promise<T>): Promise<T> {
  return compileQueue(fn);
}
