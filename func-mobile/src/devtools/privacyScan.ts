import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

/**
 * Structural privacy tripwire (design spec §14.6). Supplementary to the
 * primary enforcement — the whitelisted view types plus
 * `views.types.test.ts`'s `@ts-expect-error` assertions (§14.7) — this is a
 * plain-text regression guard against a raw-data seam being reintroduced
 * under `app/**` or `src/ui/**`.
 */
export interface ForbiddenTokenHit {
  readonly file: string;
  readonly line: number;
  readonly token: string;
  readonly text: string;
}

/** Matched anywhere on a line. */
const PLAIN_TOKENS: readonly string[] = [
  'useSnapshot',
  'useRepository',
  'lastKnownLocation',
  '.memberUserIds',
  '.attendeeGroupIds',
  '.groupChatId',
  '.hostGroupId',
  '.requestingGroupId',
  '.requests',
  '@/data/repository',
  '@/data/selectors',
  '@/data/seed',
  '@/data/InMemoryRepository',
  'friendships',
  '.getSnapshot(',
  '.demo',
];

/**
 * Matched only inside an `import ... from '...'` statement, not as a bare
 * word — these names legitimately appear in doc comments and UI copy
 * (e.g. "Group chat") that aren't a module-boundary violation.
 */
const IMPORT_ONLY_TOKENS: readonly string[] = ['PoolInvite', 'FuncUser', 'Group'];

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx']);

/**
 * Test fixtures under `__tests__/` legitimately construct raw Snapshot/user
 * data to unit-test pure helpers (map content, grouping, geo) — an
 * established pattern elsewhere in this suite. The boundary this tripwire
 * enforces is the screens/production UI surface, not test scaffolding.
 */
const EXCLUDED_DIR_NAMES = new Set(['__tests__', 'node_modules']);

const IMPORT_STATEMENT_RE = /import\s+[\s\S]*?from\s+['"][^'"]*['"];?/g;

const PROJECT_ROOT = join(__dirname, '..', '..');

function listSourceFiles(rootRelativeDir: string): string[] {
  const files: string[] = [];
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && SCAN_EXTENSIONS.has(extname(entry.name))) {
        files.push(full);
      }
    }
  };
  walk(join(PROJECT_ROOT, rootRelativeDir));
  return files;
}

function wordBoundaryRe(token: string): RegExp {
  return new RegExp(`\\b${token}\\b`);
}

export function scanForForbiddenTokens(dirs: readonly string[]): ForbiddenTokenHit[] {
  const hits: ForbiddenTokenHit[] = [];

  for (const dir of dirs) {
    for (const file of listSourceFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      const relPath = relative(PROJECT_ROOT, file);
      const lines = text.split('\n');

      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i] ?? '';
        for (const token of PLAIN_TOKENS) {
          if (line.includes(token)) {
            hits.push({ file: relPath, line: i + 1, token, text: line.trim() });
          }
        }
      }

      IMPORT_STATEMENT_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = IMPORT_STATEMENT_RE.exec(text))) {
        const statement = match[0];
        const lineNumber = text.slice(0, match.index).split('\n').length;
        for (const token of IMPORT_ONLY_TOKENS) {
          if (wordBoundaryRe(token).test(statement)) {
            hits.push({ file: relPath, line: lineNumber, token, text: statement.replace(/\s+/g, ' ').trim() });
          }
        }
      }
    }
  }

  return hits;
}
