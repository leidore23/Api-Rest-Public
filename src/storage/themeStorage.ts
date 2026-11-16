export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'jsonplaceholder-app:theme:v1'

/**
 * Lee el tema elegido, o `null` si nunca se ha elegido uno.
 *
 * La distinción importa: sin preferencia guardada hay que respetar la del
 * sistema operativo, no imponer el tema claro.
 */
export function readStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    return raw === 'light' || raw === 'dark' ? raw : null
  } catch {
    return null
  }
}

export function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Sin permiso para escribir: el tema funciona igual durante la sesión.
  }
}
