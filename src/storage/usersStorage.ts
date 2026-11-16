import type { User } from '../types'
import { createChangesStorage } from './changesStorage'
import type { Changes } from './changesStorage'

export type StoredUsers = Changes<User>

export const { read: readStoredUsers, write: writeStoredUsers } =
  createChangesStorage<User>('jsonplaceholder-app:users:v1')
