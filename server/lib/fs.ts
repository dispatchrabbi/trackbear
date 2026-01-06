import { tmpdir } from 'node:os';
import { sep } from 'node:path';
import { mkdtemp } from 'node:fs/promises';

// it's easy to get making a temporary directory in the right place wrong,
// so here's a function that does it the right way every time.
export async function makeTempDir(prefix: string): Promise<string> {
  const tmpDir = tmpdir();
  const fullPrefix = `${tmpDir}${sep}${prefix}`;

  const tempDir = await mkdtemp(fullPrefix);
  return tempDir;
}
