import { useCallback, useState } from 'react'
import { createPost } from '../api/posts'
import type { NewPostInput } from '../api/posts'
import { fetchPostsByUser } from '../api/posts'
import type { Post } from '../types'
import { useAsync } from './useAsync'

export type PostsResult =
  | { status: 'loading' }
  | { status: 'error'; message: string; reload: () => void }
  | { status: 'success'; posts: Post[] }

interface UsePostsResult {
  state: PostsResult
  create: (input: Omit<NewPostInput, 'userId'>) => Promise<void>
}

/**
 * Publicaciones de un usuario: las que vienen del servidor más las que se
 * crean en esta sesión.
 *
 * Las creadas se guardan aparte y se combinan al leer, en lugar de copiar la
 * respuesta del servidor a un estado mutable. Así la lista que se pinta sigue
 * derivándose de lo que hay, sin un efecto que sincronice dos copias de los
 * mismos datos (la fuente habitual de listas que se quedan desfasadas).
 */
export function usePosts(userId: number): UsePostsResult {
  const remote = useAsync((signal) => fetchPostsByUser(userId, signal), [userId])
  const [createdPosts, setCreatedPosts] = useState<Post[]>([])

  const create = useCallback(
    async (input: Omit<NewPostInput, 'userId'>) => {
      const post = await createPost({ ...input, userId })

      // Al principio de la lista: lo que acabas de escribir debe verse sin
      // tener que desplazarse entre las publicaciones ya existentes.
      setCreatedPosts((previous) => [post, ...previous])
    },
    [userId],
  )

  if (remote.status === 'loading') {
    return { state: { status: 'loading' }, create }
  }

  if (remote.status === 'error') {
    return {
      state: { status: 'error', message: remote.message, reload: remote.reload },
      create,
    }
  }

  return {
    state: { status: 'success', posts: [...createdPosts, ...remote.data] },
    create,
  }
}
