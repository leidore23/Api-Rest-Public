import type { User } from '../../types'
import styles from './UserList.module.css'

interface UserListProps {
  users: User[]
  selectedUserId: number | null
  onSelect: (user: User) => void
}

export function UserList({ users, selectedUserId, onSelect }: UserListProps) {
  return (
    <ul className={styles.list}>
      {users.map((user) => {
        const isSelected = user.id === selectedUserId

        return (
          <li key={user.id}>
            {/*
              La tarjeta entera es un `button` y no un `div` con `onClick`:
              así se puede llegar a ella con el tabulador, responde a Intro y
              a Espacio, y los lectores de pantalla la anuncian como algo
              pulsable sin necesidad de añadir `role` ni `tabIndex` a mano.
              Dentro van `span`, no encabezados: un `button` sólo admite
              contenido de texto, y un `h3` dentro produce HTML inválido.
            */}
            <button
              type="button"
              className={isSelected ? `${styles.item} ${styles.itemSelected}` : styles.item}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => onSelect(user)}
            >
              <span className={styles.name}>
                {user.name} <span className={styles.username}>@{user.username}</span>
              </span>
              <span className={styles.detail}>{user.email}</span>
              <span className={styles.detail}>{user.company.name}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
