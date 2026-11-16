import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import styles from './PostForm.module.css'

export interface PostFormValues {
  title: string
  body: string
}

interface PostFormProps {
  onSubmit: (values: PostFormValues) => Promise<void>
}

export function PostForm({ onSubmit }: PostFormProps) {
  const titleId = useId()
  const bodyId = useId()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({ title: title.trim(), body: body.trim() })
      setTitle('')
      setBody('')
    } catch (caught) {
      // El formulario conserva lo escrito: si la petición falla, perder el
      // texto obligaría a reescribirlo todo.
      setError(caught instanceof Error ? caught.message : 'No se pudo crear la publicación.')
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
          className={styles.input}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={bodyId}>
          Texto
        </label>
        <textarea
          id={bodyId}
          className={styles.textarea}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Publicando…' : 'Publicar'}
        </button>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  )
}
