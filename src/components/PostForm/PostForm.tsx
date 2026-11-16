import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { validatePost } from '../../lib/validatePost'
import type { PostFormErrors, PostFormValues } from '../../lib/validatePost'
import styles from './PostForm.module.css'

interface PostFormProps {
  onSubmit: (values: PostFormValues) => Promise<void>
  /** Valores de partida; con ellos el formulario sirve para editar. */
  initialValues?: PostFormValues
  legend?: string
  submitLabel?: string
  submittingLabel?: string
  /** Al crear conviene vaciar los campos; al editar, no. */
  clearOnSuccess?: boolean
  onCancel?: () => void
}

/**
 * Formulario de publicación, para crear y para editar.
 *
 * Es el mismo componente en ambos casos para que las reglas de validación, el
 * marcado accesible y el manejo de errores no existan por duplicado: corregir
 * algo en uno y olvidarlo en el otro es cuestión de tiempo.
 */
export function PostForm({
  onSubmit,
  initialValues,
  legend = 'Nueva publicación',
  submitLabel = 'Publicar',
  submittingLabel = 'Publicando…',
  clearOnSuccess = true,
  onCancel,
}: PostFormProps) {
  const titleId = useId()
  const bodyId = useId()
  const legendId = useId()

  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [body, setBody] = useState(initialValues?.body ?? '')
  const [errors, setErrors] = useState<PostFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Los errores no aparecen mientras se escribe por primera vez: regañar antes
  // de que a nadie le haya dado tiempo a rellenar el campo es molesto y además
  // deja la interfaz en rojo nada más abrirla. A partir del primer intento de
  // envío sí se revalida en cada tecla, para que el error desaparezca en
  // cuanto se corrige.
  const [hasSubmitted, setHasSubmitted] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (hasSubmitted) {
      setErrors(validatePost({ title: value, body }))
    }
  }

  function handleBodyChange(value: string) {
    setBody(value)
    if (hasSubmitted) {
      setErrors(validatePost({ title, body: value }))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setHasSubmitted(true)
    setSubmitError(null)

    const values: PostFormValues = { title: title.trim(), body: body.trim() }
    const nextErrors = validatePost(values)
    setErrors(nextErrors)

    // Llevar el foco al primer campo inválido evita que, en un formulario
    // largo, el mensaje de error quede fuera de la pantalla y parezca que el
    // botón no hace nada.
    if (nextErrors.title) {
      titleRef.current?.focus()
      return
    }

    if (nextErrors.body) {
      bodyRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(values)

      if (clearOnSuccess) {
        setTitle('')
        setBody('')
      }

      setErrors({})
      setHasSubmitted(false)
    } catch (caught) {
      // El formulario conserva lo escrito: si la petición falla, perder el
      // texto obligaría a reescribirlo todo.
      setSubmitError(
        caught instanceof Error ? caught.message : 'No se pudo guardar la publicación.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // `aria-labelledby` da nombre al formulario. Hace falta porque al editar hay
  // dos en pantalla, cada uno con un campo "Título": sin nombre, un lector de
  // pantalla los anuncia igual y no hay forma de distinguirlos. De paso
  // convierte el elemento en una región con rol `form`.
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

      <div className={styles.field}>
        <label className={styles.label} htmlFor={titleId}>
          Título
        </label>
        <input
          id={titleId}
          ref={titleRef}
          className={styles.input}
          value={title}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${titleId}-error` : undefined}
          onChange={(event) => handleTitleChange(event.target.value)}
        />
        {errors.title ? (
          <p className={styles.error} id={`${titleId}-error`}>
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={bodyId}>
          Texto
        </label>
        <textarea
          id={bodyId}
          ref={bodyRef}
          className={styles.textarea}
          value={body}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? `${bodyId}-error` : undefined}
          onChange={(event) => handleBodyChange(event.target.value)}
        />
        {errors.body ? (
          <p className={styles.error} id={`${bodyId}-error`}>
            {errors.body}
          </p>
        ) : null}
      </div>

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
