/**
 * Unfinished form answers kept in this browser, so a parent who reloads,
 * loses their connection or closes the tab can pick up where they left off.
 *
 * Drafts hold personal details, and families often share a computer, so
 * each one belongs to a single signed-in account, expires after a week,
 * and every draft is wiped once nobody is signed in (see SiteLayout).
 * Storage can be unavailable (private browsing, blocked site data), so
 * every access is guarded and simply does nothing when it fails.
 */

const PREFIX = 'evims-draft:';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type StoredDraft<T> = { savedAt: number; value: T };

export type Draft<T> = { savedAt: Date; value: T };

export function readDraft<T>(key: string): Draft<T> | null {
    try {
        const raw = window.localStorage.getItem(PREFIX + key);

        if (!raw) {
            return null;
        }

        const draft = JSON.parse(raw) as StoredDraft<T>;

        if (
            typeof draft?.savedAt !== 'number' ||
            Date.now() - draft.savedAt > MAX_AGE_MS
        ) {
            clearDraft(key);

            return null;
        }

        return { savedAt: new Date(draft.savedAt), value: draft.value };
    } catch {
        return null;
    }
}

export function saveDraft<T>(key: string, value: T): void {
    try {
        const draft: StoredDraft<T> = { savedAt: Date.now(), value };
        window.localStorage.setItem(PREFIX + key, JSON.stringify(draft));
    } catch {
        // Storage full or blocked: the form still works, just without a draft.
    }
}

export function clearDraft(key: string): void {
    try {
        window.localStorage.removeItem(PREFIX + key);
    } catch {
        // Nothing to clear.
    }
}

/** Removes every saved draft, e.g. once the parent has signed out. */
export function clearAllDrafts(): void {
    try {
        Object.keys(window.localStorage)
            .filter((key) => key.startsWith(PREFIX))
            .forEach((key) => window.localStorage.removeItem(key));
    } catch {
        // Nothing to clear.
    }
}
