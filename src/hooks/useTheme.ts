import { useCallback, useEffect, useState } from 'react'
import { readStoredTheme, writeStoredTheme } from '../storage/themeStorage'
import type { Theme } from '../storage/themeStorage'

function getInitialTheme(): Theme {
  const stored = readStoredTheme()

  if (stored !== null) {
    return stored
  }

  // Sin elección previa manda el sistema operativo. `matchMedia` no existe en
  // todos los entornos de prueba, de ahí la comprobación.
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return 'light'
}

/**
 * Tema claro u oscuro.
 *
 * El tema se aplica poniendo `data-theme` en el elemento raíz, no pasando
 * clases por el árbol de componentes: los colores son variables CSS definidas
 * en `:root`, así que cambiar un atributo repinta toda la aplicación sin que
 * ningún componente tenga que saber qué tema está activo.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeStoredTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
