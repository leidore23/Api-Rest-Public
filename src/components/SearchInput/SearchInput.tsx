import { useId } from 'react'
import styles from './SearchInput.module.css'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Campo de búsqueda controlado.
 *
 * Sin `debounce` a propósito: filtra diez elementos que ya están en memoria,
 * así que retrasar el filtrado sólo añadiría la sensación de que la interfaz
 * va por detrás de lo que se escribe.
 */
export function SearchInput({ value, onChange }: SearchInputProps) {
  // `useId` evita colisiones si algún día hay más de un campo en la página.
  const inputId = useId()

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        Buscar por nombre
      </label>
      <input
        id={inputId}
        className={styles.input}
        type="search"
        value={value}
        placeholder="Escribe un nombre…"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
