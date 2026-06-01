import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

export function listFiles(dir: string): string[] {
  const out: string[] = [];

  function walk(current: string): void {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        out.push(relative(dir, fullPath));
      }
    }
  }

  if (existsSync(dir)) {
    walk(dir);
  }

  return out.sort();
}

export function assertFileEquals(actualPath: string, expectedPath: string): void {
  const actual = readFileSync(actualPath);
  const expected = readFileSync(expectedPath);

  if (actual.equals(expected)) {
    return;
  }

  throw new Error(
    [
      `File differs: ${actualPath} != ${expectedPath}`,
      "--- expected",
      expected.toString("utf8"),
      "--- actual",
      actual.toString("utf8"),
      "--- end",
    ].join("\n"),
  );
}

export function assertNoPath(path: string): void {
  if (!existsSync(path)) {
    return;
  }

  const kind = statSync(path).isDirectory() ? "directory" : "file";
  throw new Error(`Expected no ${kind} at ${path}`);
}

export function ensureParent(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}
