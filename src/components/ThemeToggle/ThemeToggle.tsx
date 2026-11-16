import type { Theme } from '../../storage/themeStorage'
import styles from './ThemeToggle.module.css'

interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={styles.toggle}
      // El nombre accesible describe lo que va a pasar al pulsar, no el estado
      // actual: "Tema oscuro" sería ambiguo (¿está activo, o lo activo?).
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      onClick={onToggle}
    >
      <span className={styles.icon} aria-hidden="true">
        {isDark ? '☀' : '☾'}
      </span>
      {isDark ? 'Claro' : 'Oscuro'}
    </button>
  )
}
