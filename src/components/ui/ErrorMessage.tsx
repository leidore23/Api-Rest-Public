import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

/**
 * Mensaje de error. `role="alert"` lo anuncia en cuanto se monta, que es el
 * comportamiento que se espera de algo que interrumpe la tarea del usuario.
 */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.wrapper} role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}
