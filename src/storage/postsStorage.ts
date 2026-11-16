import type { Post } from '../types'
import { createChangesStorage } from './changesStorage'
import type { Changes } from './changesStorage'

export type StoredPosts = Changes<Post>

export const { read: readStoredPosts, write: writeStoredPosts } =
  createChangesStorage<Post>('jsonplaceholder-app:posts:v1')
