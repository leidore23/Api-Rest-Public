import type { Post } from '../types'

/**
 * Los cambios locales sobre las publicaciones, en las mismas tres capas que
 * maneja `usePosts`: creadas, editadas y borradas.
 */
export interface StoredPosts {
  created: Post[]
  edited: Record<string, Post>
  deleted: string[]
}

/**
 * La clave lleva espacio de nombres y versión. El espacio de nombres evita
 * chocar con otra aplicación servida desde el mismo origen (en desarrollo,
 * `localhost` es un origen compartido por todos los proyectos). La versión
 * permite cambiar la forma del dato más adelante sin tener que lidiar con lo
 * que quedó guardado de la versión anterior: basta subir a `v2`.
 */
const STORAGE_KEY = 'jsonplaceholder-app:posts:v1'

const EMPTY: StoredPosts = { created: [], edited: {}, deleted: [] }

function isStoredPosts(value: unknown): value is StoredPosts {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<StoredPosts>

  return (
    Array.isArray(candidate.created) &&
    Array.isArray(candidate.deleted) &&
    typeof candidate.edited === 'object' &&
    candidate.edited !== null
  )
}

/**
 * Lee los cambios guardados.
 *
 * Nunca lanza. `localStorage` da error en el modo privado de Safari y cuando
 * la cuota está llena, y lo guardado puede estar corrupto o venir de una
 * versión anterior del formato. Ante cualquiera de esos casos se devuelve el
 * estado vacío: perder los cambios locales es molesto, pero que la aplicación
 * no arranque es peor.
 */
export function readStoredPosts(): StoredPosts {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw === null) {
      return EMPTY
    }

    const parsed: unknown = JSON.parse(raw)

    return isStoredPosts(parsed) ? parsed : EMPTY
  } catch {
    return EMPTY
  }
}

/** Guarda los cambios. Tampoco lanza: si no se puede escribir, se sigue. */
export function writeStoredPosts(value: StoredPosts): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Sin espacio o sin permiso para escribir: la sesión sigue funcionando en
    // memoria, sólo que no sobrevivirá a una recarga.
  }
}
