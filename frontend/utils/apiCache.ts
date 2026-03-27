interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStore {
  [key: string]: CacheEntry<any>;
}

const cache: CacheStore = {};

export const getCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${endpoint}:${paramStr}`;
};

export const setCache = <T>(key: string, data: T, ttlMs: number = 3600000): void => {
  cache[key] = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  };
};

export const getCache = <T>(key: string): T | null => {
  const entry = cache[key];
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > entry.ttl) {
    delete cache[key];
    return null;
  }

  return entry.data as T;
};

export const clearCache = (key?: string): void => {
  if (key) {
    delete cache[key];
  } else {
    for (const k in cache) {
      delete cache[k];
    }
  }
};

export const getCacheStats = () => {
  const keys = Object.keys(cache);
  return {
    size: keys.length,
    keys,
  };
};
