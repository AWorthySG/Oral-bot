import type { SaveData } from '../types';

const KEY = 'oralbot:save';
let timer: number | null = null;

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveNow(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked - the game still works, it just won't persist.
  }
}

/** Debounced autosave (500ms) so rapid XP gains coalesce into one write. */
export function scheduleSave(getData: () => SaveData): void {
  if (timer !== null) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    saveNow(getData());
  }, 500);
}

export function resetSave(): void {
  if (timer !== null) window.clearTimeout(timer);
  timer = null;
  localStorage.removeItem(KEY);
}
