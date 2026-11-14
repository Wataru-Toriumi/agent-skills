import { randomUUID } from 'node:crypto';
import fs from 'node:fs';

export type TextFile = {
  path: string;
  content: string;
};

export type FileEdit = {
  path: string;
  before: string | null; // null means the file does not exist yet.
  after: string;
};

export const assertDirectory = (path: string): void => {
  if (!fs.lstatSync(path).isDirectory()) {
    throw new Error(`Expected a directory, not a symlink or file: ${path}`);
  }
};

export const readTextFile = (path: string): TextFile => {
  if (!fs.lstatSync(path).isFile()) {
    throw new Error(`Expected a regular file: ${path}`);
  }
  return { path, content: fs.readFileSync(path, 'utf8') };
};

export const readJsonFile = (path: string): { file: TextFile; value: unknown } => {
  const file = readTextFile(path);
  return { file, value: JSON.parse(file.content) };
};

export const formatJson = (value: unknown): string => {
  return `${JSON.stringify(value, null, 2)}\n`;
};

const restoreFiles = (edits: FileEdit[]): void => {
  for (const edit of [...edits].reverse()) {
    if (edit.before === null) {
      fs.rmSync(edit.path);
    } else {
      fs.writeFileSync(edit.path, edit.before, 'utf8');
    }
  }
};

// Stage all contents before replacing files. Recover completed replacements on error.
export const applyFileEdits = (edits: FileEdit[]): void => {
  const staged: Array<{ edit: FileEdit; temporaryPath: string }> = [];
  const applied: FileEdit[] = [];

  try {
    for (const edit of edits) {
      const temporaryPath = `${edit.path}.${randomUUID()}.tmp`;
      staged.push({ edit, temporaryPath });
      fs.writeFileSync(temporaryPath, edit.after, { encoding: 'utf8', flag: 'wx' });
    }

    for (const { edit, temporaryPath } of staged) {
      fs.renameSync(temporaryPath, edit.path);
      applied.push(edit);
    }
  } catch (error) {
    restoreFiles(applied);
    throw error;
  } finally {
    for (const { temporaryPath } of staged) {
      fs.rmSync(temporaryPath, { force: true });
    }
  }
};
