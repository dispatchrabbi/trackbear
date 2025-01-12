import { readFile } from 'node:fs/promises';

export async function importRawSql(filepath: string): Promise<string> {
  const contents = await readFile(filepath, { encoding: 'utf-8' });
  const rawSql = contents.toString();
  return rawSql;
}