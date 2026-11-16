import type { User } from '../../types'
import styles from './UserList.module.css'

interface UserListProps {
  users: User[]
}

export function UserList({ users }: UserListProps) {
  return (
    <ul className={styles.list}>
      {users.map((user) => (
        <li key={user.id} className={styles.item}>
          <h3 className={styles.name}>
            {user.name} <span className={styles.username}>@{user.username}</span>
          </h3>
          <p className={styles.detail}>{user.email}</p>
          <p className={styles.detail}>{user.company.name}</p>
        </li>
      ))}
    </ul>
  )
}
