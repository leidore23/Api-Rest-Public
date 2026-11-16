import { useCallback, useEffect, useState } from 'react'
import { createUser, deleteUser, fetchUsers, updateUser } from '../api/users'
import type { UserFormValues } from '../lib/validateUser'
import { readStoredUsers, writeStoredUsers } from '../storage/usersStorage'
import type { StoredUsers } from '../storage/usersStorage'
import type { User } from '../types'
import { useAsync } from './useAsync'

export type UsersState =
  | { status: 'loading' }
  | { status: 'error'; message: string; reload: () => void }
  | { status: 'success'; users: User[] }

interface UseUsersResult {
  state: UsersState
  create: (values: UserFormValues) => Promise<void>
  update: (user: User, values: UserFormValues) => Promise<void>
  remove: (user: User) => Promise<void>
}

/**
 * Usuarios y las operaciones sobre ellos.
 *
 * Mismo planteamiento que `usePosts`: tres capas de cambios locales —creados,
 * editados y borrados— que se aplican sobre la respuesta del servidor al leer,
 * en lugar de copiarla a un estado mutable. Las dos colecciones comparten
 * además el almacenamiento (`createChangesStorage`), porque guardan la misma
 * estructura.
 */
export function useUsers(): UseUsersResult {
  const remote = useAsync((signal) => fetchUsers(signal), [])

  const [changes, setChanges] = useState<StoredUsers>(readStoredUsers)

  useEffect(() => {
    writeStoredUsers(changes)
  }, [changes])

  const create = useCallback(async (values: UserFormValues) => {
    const user = await createUser(values)

    setChanges((previous) => ({ ...previous, created: [user, ...previous.created] }))
  }, [])

  const update = useCallback(async (user: User, values: UserFormValues) => {
    const updated = await updateUser(user, values)

    setChanges((previous) => ({
      ...previous,
      edited: { ...previous.edited, [user.id]: updated },
    }))
  }, [])

  const remove = useCallback(async (user: User) => {
    await deleteUser(user)

    setChanges((previous) => ({ ...previous, deleted: [...previous.deleted, user.id] }))
  }, [])

  if (remote.status === 'loading') {
    return { state: { status: 'loading' }, create, update, remove }
  }

  if (remote.status === 'error') {
    return {
      state: { status: 'error', message: remote.message, reload: remote.reload },
      create,
      update,
      remove,
    }
  }

  const users = [...changes.created, ...remote.data]
    .filter((user) => !changes.deleted.includes(user.id))
    .map((user) => changes.edited[user.id] ?? user)

  return { state: { status: 'success', users }, create, update, remove }
}
