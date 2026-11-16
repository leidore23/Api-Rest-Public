import type { UserFormValues } from '../../lib/validateUser'
import type { User } from '../../types'
import { UserItem } from './UserItem'
import styles from './UserList.module.css'

interface UserListProps {
  users: User[]
  selectedUserId: string | null
  onSelect: (user: User) => void
  onUpdate: (user: User, values: UserFormValues) => Promise<void>
  onDelete: (user: User) => Promise<void>
}

export function UserList({
  users,
  selectedUserId,
  onSelect,
  onUpdate,
  onDelete,
}: UserListProps) {
  return (
    <ul className={styles.list}>
      {users.map((user) => (
        <UserItem
          key={user.id}
          user={user}
          isSelected={user.id === selectedUserId}
          onSelect={() => onSelect(user)}
          onUpdate={(values) => onUpdate(user, values)}
          onDelete={() => onDelete(user)}
        />
      ))}
    </ul>
  )
}
