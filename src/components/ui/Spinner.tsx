import styles from './Spinner.module.css'

interface SpinnerProps {
  label: string
}

/**
 * Indicador de carga. El `role="status"` hace que los lectores de pantalla
 * anuncien el texto cuando aparece, sin robar el foco.
 */
export function Spinner({ label }: SpinnerProps) {
  return (
    <div className={styles.wrapper} role="status">
      <span className={styles.dot} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
