/**
 * Vitest global test setup.
 *
 * Mocks `next/headers` so that Server Actions (which depend on cookies()
 * from Next.js) can run outside of the Next.js server context.
 */
import { vi } from 'vitest';

// ──────────────────────────────────────────────────────────────
// Mock: next/headers
// ──────────────────────────────────────────────────────────────
interface CookieEntry {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

const cookieStore: CookieEntry[] = [];

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get(name: string) {
      return cookieStore.find((c) => c.name === name) ?? undefined;
    },
    getAll(name?: string) {
      return name
        ? cookieStore.filter((c) => c.name === name)
        : [...cookieStore];
    },
    set(name: string, value: string, options?: Record<string, unknown>) {
      const idx = cookieStore.findIndex((c) => c.name === name);
      const entry: CookieEntry = { name, value, options };
      if (idx >= 0) {
        cookieStore[idx] = entry;
      } else {
        cookieStore.push(entry);
      }
    },
    delete(name: string) {
      const idx = cookieStore.findIndex((c) => c.name === name);
      if (idx >= 0) cookieStore.splice(idx, 1);
    },
  })),
}));
