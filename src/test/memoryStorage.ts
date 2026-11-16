/**
 * Node 22+ expone su propio `localStorage` experimental en el ámbito global.
 * Cuando el proceso arranca sin un `--localstorage-file` válido (como hacen los
 * workers de Vitest), ese global llega como un objeto vacío y además tapa el
 * `Storage` que implementa jsdom, así que `localStorage.setItem` revienta.
 *
 * En lugar de atarnos a `--no-webstorage` (que no existe antes de Node 22 y
 * haría fallar el arranque en versiones anteriores), detectamos si el
 * `localStorage` del entorno es utilizable y, sólo si no lo es, lo sustituimos
 * por una implementación en memoria equivalente.
 */

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  const storage = {
    get length() {
      return store.size
    },
    key(index: number): string | null {
      return [...store.keys()][index] ?? null
    },
    getItem(key: string): string | null {
      return store.get(String(key)) ?? null
    },
    setItem(key: string, value: string): void {
      store.set(String(key), String(value))
    },
    removeItem(key: string): void {
      store.delete(String(key))
    },
    clear(): void {
      store.clear()
    },
  }

  return storage as unknown as Storage
}

export function installLocalStorageIfBroken(): void {
  const ambient = globalThis.localStorage as Storage | undefined

  if (typeof ambient?.clear === 'function') {
    return
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: createMemoryStorage(),
  })
}
