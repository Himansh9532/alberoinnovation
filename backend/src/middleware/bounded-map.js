const DEFAULT_MAX_ENTRIES = 10_000;

export function setBoundedMapEntry(map, key, value, maxEntries = DEFAULT_MAX_ENTRIES) {
  if (!map.has(key) && map.size >= maxEntries) {
    map.delete(map.keys().next().value);
  }
  map.set(key, value);
}
