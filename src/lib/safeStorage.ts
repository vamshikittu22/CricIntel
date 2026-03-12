// In-memory fallback for environments where localStorage is blocked (e.g., incognito mode, third-party cookie restrictions)
const memoryStorage: Record<string, string> = {};

const isStorageAvailable = () => {
  try {
    localStorage.setItem("__test__", "test");
    localStorage.removeItem("__test__");
    return true;
  } catch (e) {
    return false;
  }
};

const hasLocalStorage = isStorageAvailable();

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (!hasLocalStorage) return memoryStorage[key] || null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage getItem denied, using memory:", e);
      return memoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!hasLocalStorage) {
      memoryStorage[key] = value;
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage setItem denied, using memory:", e);
      memoryStorage[key] = value;
    }
  },
  removeItem: (key: string): void => {
    if (!hasLocalStorage) {
      delete memoryStorage[key];
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage removeItem denied, using memory:", e);
      delete memoryStorage[key];
    }
  },
  // Add clear method if needed by some storage interfaces
  clear: (): void => {
    if (!hasLocalStorage) {
      Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
      return;
    }
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("Storage clear denied, using memory:", e);
      Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
    }
  }
};

