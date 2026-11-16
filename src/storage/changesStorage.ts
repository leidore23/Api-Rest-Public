/**
 * Los cambios locales sobre una colección, en las mismas tres capas que
 * manejan los hooks: creados, editados y borrados.
 */
export interface Changes<T> {
  created: T[]
  edited: Record<string, T>
  deleted: string[]
}

function emptyChanges<T>(): Changes<T> {
  return { created: [], edited: {}, deleted: [] }
}

function hasChangesShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<Changes<unknown>>

  return (
    Array.isArray(candidate.created) &&
    Array.isArray(candidate.deleted) &&
    typeof candidate.edited === 'object' &&
    candidate.edited !== null
  )
}

/**
 * Crea el par leer/guardar para una colección en `localStorage`.
 *
 * Publicaciones y usuarios guardan exactamente la misma estructura, así que
 * comparten implementación: duplicarla significaría arreglar en un sitio el
 * manejo de un JSON corrupto y olvidarlo en el otro.
 *
 * La clave que se le pasa lleva espacio de nombres y versión. El espacio de
 * nombres evita chocar con otra aplicación del mismo origen (en desarrollo,
 * `localhost` lo comparten todos los proyectos). La versión permite cambiar la
 * forma del dato sin lidiar con lo guardado por la versión anterior: basta
 * subir a `v2`.
 */
export function createChangesStorage<T>(storageKey: string) {
  /**
   * Lee los cambios guardados. Nunca lanza.
   *
   * `localStorage` da error en el modo privado de Safari y con la cuota llena,
   * y lo guardado puede estar corrupto o venir de un formato anterior. Ante
   * cualquiera de esos casos se devuelve el estado vacío: perder los cambios
   * locales es molesto, pero que la aplicación no arranque es peor.
   */
  function read(): Changes<T> {
    try {
      const raw = localStorage.getItem(storageKey)

      if (raw === null) {
        return emptyChanges<T>()
      }

      const parsed: unknown = JSON.parse(raw)

      return hasChangesShape(parsed) ? (parsed as Changes<T>) : emptyChanges<T>()
    } catch {
      return emptyChanges<T>()
    }
  }

  /** Guarda los cambios. Tampoco lanza: si no se puede escribir, se sigue. */
  function write(value: Changes<T>): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Sin espacio o sin permiso: la sesión sigue funcionando en memoria,
      // sólo que no sobrevivirá a una recarga.
    }
  }

  return { read, write }
}
