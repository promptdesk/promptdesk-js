type FunctionType = (...args: any[]) => any;

export const memoize = (fn: FunctionType, limit: number = 100): FunctionType => {
  let cache: { [key: string]: any } = {};
  let keys: string[] = []; // This will track the "use" order for LRU eviction

  return (...args: any[]) => {
    const key = JSON.stringify(args);
    const found = key in cache;

    if (found) {
      // If the key is found, move it to the end to mark it as recently used
      keys = keys.filter(k => k !== key).concat(key);
    } else {
      const result = fn(...args);
      cache[key] = result;
      keys.push(key); // Add the new key to the end (most recently used position)

      // If the cache exceeds the limit, remove the least recently used item
      if (keys.length > limit) {
        const oldestKey = keys.shift(); // This is the least recently used key
        if (oldestKey !== undefined) {
          delete cache[oldestKey];
        }
      }

      return result;
    }

    return cache[key];
  };
};
