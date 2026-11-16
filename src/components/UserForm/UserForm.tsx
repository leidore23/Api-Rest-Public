import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { validateUser } from '../../lib/validateUser'
import type { UserFormErrors, UserFormValues } from '../../lib/validateUser'
import styles from './UserForm.module.css'

interface UserFormProps {
  onSubmit: (values: UserFormValues) => Promise<void>
  initialValues?: UserFormValues
  legend?: string
  submitLabel?: string
  submittingLabel?: string
  clearOnSuccess?: boolean
  onCancel?: () => void
}

const CAMPOS = [
  { key: 'name', label: 'Nombre' },
  { key: 'username', label: 'Nombre de usuario' },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Empresa (opcional)' },
] as const

const VACIO: UserFormValues = { name: '', username: '', email: '', company: '' }

/**
 * Formulario de usuario, para crear y para editar.
 *
 * Mismo criterio que en `PostForm`: un único componente para ambos casos, de
 * forma que las reglas, el marcado accesible y el manejo de errores no existan
 * por duplicado. Los campos se recorren desde una lista porque son cuatro con
 * la misma estructura, y repetir el bloque cuatro veces invita a que uno se
 * quede sin `aria-describedby` el día que se toque.
 */
export function UserForm({
  onSubmit,
  initialValues,
  legend = 'Nuevo usuario',
  submitLabel = 'Crear usuario',
  submittingLabel = 'Creando…',
  clearOnSuccess = true,
  onCancel,
}: UserFormProps) {
  const baseId = useId()
  const legendId = `${baseId}-legend`
  // Se guardan los `ref` de todos los campos, no sólo el del primero
  // inválido. Asignar el `ref` en función del estado de errores no funciona:
  // `setErrors` no ha provocado el re-render todavía cuando toca mover el
  // foco, así que el `ref` seguiría apuntando al campo equivocado.
  const inputRefs = useRef<Partial<Record<keyof UserFormValues, HTMLInputElement | null>>>({})

  const [values, setValues] = useState<UserFormValues>(initialValues ?? VACIO)
  const [errors, setErrors] = useState<UserFormErrors>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleChange(key: keyof UserFormValues, value: string) {
    const next = { ...values, [key]: value }
    setValues(next)

    // Sólo se revalida tras el primer intento de envío: señalar errores antes
    // de que dé tiempo a rellenar nada deja el formulario en rojo al abrirlo.
    if (hasSubmitted) {
      setErrors(validateUser(next))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setHasSubmitted(true)
    setSubmitError(null)

    const trimmed: UserFormValues = {
      name: values.name.trim(),
      username: values.username.trim(),
      email: values.email.trim(),
      company: values.company.trim(),
    }

    const nextErrors = validateUser(trimmed)
    setErrors(nextErrors)

    // Llevar el foco al primer campo inválido evita que el mensaje quede
    // fuera de la pantalla y parezca que el botón no hace nada.
    const firstInvalid = CAMPOS.find((campo) => nextErrors[campo.key])?.key

    if (firstInvalid !== undefined) {
      inputRefs.current[firstInvalid]?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(trimmed)

      if (clearOnSuccess) {
        setValues(VACIO)
      }

      setErrors({})
      setHasSubmitted(false)
    } catch (caught) {
      setSubmitError(
        caught instanceof Error ? caught.message : 'No se pudo guardar el usuario.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-labelledby={legendId}
      noValidate
    >
      <p className={styles.legend} id={legendId}>
        {legend}
      </p>

      {CAMPOS.map((campo) => {
        const error = errors[campo.key]
        const fieldId = `${baseId}-${campo.key}`

        return (
          <div className={styles.field} key={campo.key}>
            <label className={styles.label} htmlFor={fieldId}>
              {campo.label}
            </label>
            <input
              id={fieldId}
              ref={(node) => {
                inputRefs.current[campo.key] = node
              }}
              className={styles.input}
              type={campo.key === 'email' ? 'email' : 'text'}
              value={values[campo.key]}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${fieldId}-error` : undefined}
              onChange={(event) => handleChange(campo.key, event.target.value)}
            />
            {error ? (
              <p className={styles.error} id={`${fieldId}-error`}>
                {error}
              </p>
            ) : null}
          </div>
        )
      })}

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        ) : null}
        {submitError ? (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        ) : null}
      </div>
    </form>
  )
}
