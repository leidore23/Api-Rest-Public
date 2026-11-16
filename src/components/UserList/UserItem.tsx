import { useState } from 'react'
import type { UserFormValues } from '../../lib/validateUser'
import type { User } from '../../types'
import { UserForm } from '../UserForm/UserForm'
import styles from './UserList.module.css'

interface UserItemProps {
  user: User
  isSelected: boolean
  onSelect: () => void
  onUpdate: (values: UserFormValues) => Promise<void>
  onDelete: () => Promise<void>
}

export function UserItem({ user, isSelected, onSelect, onUpdate, onDelete }: UserItemProps) {
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
      setDeleteError(caught instanceof Error ? caught.message : 'No se pudo borrar el usuario.')
      setIsDeleting(false)
      setIsConfirmingDelete(false)
    }
  }

  if (isEditing) {
    return (
      <li>
        <UserForm
          legend="Editar usuario"
          submitLabel="Guardar"
          submittingLabel="Guardando…"
          initialValues={{
            name: user.name,
            username: user.username,
            email: user.email,
            company: user.company.name,
          }}
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
    <li className={isSelected ? `${styles.item} ${styles.itemSelected}` : styles.item}>
      {/*
        El botón de selección y los de acción son hermanos, no anidados: un
        `button` dentro de otro es HTML inválido y el navegador sólo entrega
        el clic a uno de los dos.
      */}
      <button
        type="button"
        className={styles.select}
        // Sin nombre propio, el botón se llamaría con todo el contenido de la
        // tarjeta ("Leanne Graham @Bret Sincere@april.biz Romaguera-Crona") y
        // sería indistinguible de los de editar y borrar, que también llevan
        // el nombre. Así se anuncia qué hace, no qué contiene.
        aria-label={`Ver publicaciones de ${user.name}`}
        aria-current={isSelected ? 'true' : undefined}
        onClick={onSelect}
      >
        <span className={styles.name}>
          {user.name} <span className={styles.username}>@{user.username}</span>
        </span>
        <span className={styles.detail}>{user.email}</span>
        {user.company.name ? <span className={styles.detail}>{user.company.name}</span> : null}
      </button>

      <div className={styles.actions}>
        {isConfirmingDelete ? (
          <>
            <span className={styles.confirm}>¿Borrar a {user.name}?</span>
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
              El `aria-label` incluye el nombre porque hay un botón "Editar"
              por usuario: sin él, un lector de pantalla anuncia diez veces lo
              mismo sin decir sobre quién actúa.
            */}
            <button
              type="button"
              className={styles.action}
              aria-label={`Editar: ${user.name}`}
              onClick={() => setIsEditing(true)}
            >
              Editar
            </button>
            <button
              type="button"
              className={styles.action}
              aria-label={`Borrar: ${user.name}`}
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
