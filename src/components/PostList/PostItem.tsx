import { useState } from 'react'
import type { Post } from '../../types'
import type { PostFormValues } from '../../lib/validatePost'
import { PostForm } from '../PostForm/PostForm'
import styles from './PostList.module.css'

interface PostItemProps {
  post: Post
  onUpdate: (values: PostFormValues) => Promise<void>
  onDelete: () => Promise<void>
}

export function PostItem({ post, onUpdate, onDelete }: PostItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await onDelete()
      // No se restablece el estado: si sale bien, este elemento desaparece.
    } catch (caught) {
      setDeleteError(
        caught instanceof Error ? caught.message : 'No se pudo borrar la publicación.',
      )
      setIsDeleting(false)
      setIsConfirmingDelete(false)
    }
  }

  if (isEditing) {
    return (
      <li className={styles.item}>
        <PostForm
          legend="Editar publicación"
          submitLabel="Guardar"
          submittingLabel="Guardando…"
          initialValues={{ title: post.title, body: post.body }}
          clearOnSuccess={false}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(values)
            setIsEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className={styles.item}>
      <h3 className={styles.title}>{post.title}</h3>
      <p className={styles.body}>{post.body}</p>

      <div className={styles.actions}>
        {isConfirmingDelete ? (
          <>
            {/*
              Confirmación en línea en lugar de `window.confirm`: no bloquea la
              pestaña, se puede dar estilo, y es lo que se puede probar.
            */}
            <span className={styles.confirm}>¿Borrar esta publicación?</span>
            <button
              type="button"
              className={styles.danger}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Borrando…' : 'Sí, borrar'}
            </button>
            <button
              type="button"
              className={styles.action}
              onClick={() => setIsConfirmingDelete(false)}
              disabled={isDeleting}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            {/*
              El `aria-label` incluye el título porque en una lista hay muchos
              botones "Editar": sin él, un lector de pantalla anuncia diez
              veces lo mismo sin decir sobre qué actúa.
            */}
            <button
              type="button"
              className={styles.action}
              aria-label={`Editar: ${post.title}`}
              onClick={() => setIsEditing(true)}
            >
              Editar
            </button>
            <button
              type="button"
              className={styles.action}
              aria-label={`Borrar: ${post.title}`}
              onClick={() => setIsConfirmingDelete(true)}
            >
              Borrar
            </button>
          </>
        )}
      </div>

      {deleteError ? (
        <p className={styles.error} role="alert">
          {deleteError}
        </p>
      ) : null}
    </li>
  )
}
