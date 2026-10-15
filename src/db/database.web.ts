/**
 * Web stub. expo-sqlite on web is alpha and requires wasm Metro support plus
 * COOP/COEP headers, which this project does not configure. On web the app keeps
 * using the storage-backed queue and snapshot cache.
 */
export function getLocalDb(): Promise<null> {
  return Promise.resolve(null);
}

export type LocalDb = never;
