// Persists in-progress answers to this browser so navigating away (home,
// another page, a closed tab) and coming back doesn't lose what was already
// filled in. File inputs can't be serialized to localStorage, so uploaded
// files are intentionally left out — those need to be reselected.
const DRAFT_STORAGE_KEY = 'evims:enrollment-draft';

export const DRAFT_FILE_FIELDS = [
    'form_138',
    'birth_certificate',
    'good_moral_certificate',
];

export function loadDraft() {
    if (typeof window === 'undefined') return null;

    try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveDraft(draft: unknown) {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
        // Storage full, disabled, or unavailable (private browsing) — the
        // form still works, it just won't survive navigating away.
    }
}

export function clearDraft() {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
        // Nothing to do if storage isn't available.
    }
}
