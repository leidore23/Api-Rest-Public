import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { validatePost } from '../../lib/validatePost'
import type { PostFormErrors, PostFormValues } from '../../lib/validatePost'
import styles from './PostForm.module.css'

interface PostFormProps {
  onSubmit: (values: PostFormValues) => Promise<void>
}

export function PostForm({ onSubmit }: PostFormProps) {
  const titleId = useId()
  const bodyId = useId()

  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
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
      setTitle('')
      setBody('')
      setErrors({})
      setHasSubmitted(false)
    } catch (caught) {
      // El formulario conserva lo escrito: si la petición falla, perder el
      // texto obligaría a reescribirlo todo.
      setSubmitError(
        caught instanceof Error ? caught.message : 'No se pudo crear la publicación.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.legend}>Nueva publicación</p>

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
          {isSubmitting ? 'Publicando…' : 'Publicar'}
        </button>
        {submitError ? (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        ) : null}
      </div>
    </form>
  )
}
