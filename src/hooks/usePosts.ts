import { useCallback, useEffect, useState } from 'react'
import { createPost, deletePost, fetchPostsByUser, updatePost } from '../api/posts'
import type { PostFormValues } from '../lib/validatePost'
import { readStoredPosts, writeStoredPosts } from '../storage/postsStorage'
import type { StoredPosts } from '../storage/postsStorage'
import type { Post } from '../types'
import { useAsync } from './useAsync'

export type PostsState =
  | { status: 'loading' }
  | { status: 'error'; message: string; reload: () => void }
  | { status: 'success'; posts: Post[] }

interface UsePostsResult {
  state: PostsState
  create: (values: PostFormValues) => Promise<void>
  update: (post: Post, values: PostFormValues) => Promise<void>
  remove: (post: Post) => Promise<void>
}

/**
 * Publicaciones de un usuario y las operaciones sobre ellas.
 *
 * La respuesta del servidor no se copia a un estado mutable. En su lugar se
 * mantienen tres capas —creadas, editadas y borradas— que se aplican al leer.
 * Así la lista sigue derivándose de lo que hay, sin un efecto sincronizando
 * dos copias de los mismos datos, que es la fuente habitual de listas que se
 * quedan desfasadas. Y recargar desde el servidor no obliga a reconciliar
 * nada: las capas se vuelven a aplicar solas.
 *
 * Esas tres capas son justo lo que se guarda en `localStorage`, porque son la
 * única información que no se puede volver a pedir: la API no guarda nada de
 * lo que se le envía.
 */
export function usePosts(userId: string): UsePostsResult {
  const remote = useAsync((signal) => fetchPostsByUser(userId, signal), [userId])

  // Un único estado para las tres capas, y no tres por separado: así se
  // persisten juntas con un solo efecto, sin riesgo de guardar una versión a
  // medias en la que ya se borró algo pero todavía no se registró.
  const [changes, setChanges] = useState<StoredPosts>(readStoredPosts)

  useEffect(() => {
    writeStoredPosts(changes)
  }, [changes])

  const create = useCallback(
    async (values: PostFormValues) => {
      const post = await createPost({ ...values, userId })

      // Al principio de la lista: lo que acabas de escribir debe verse sin
      // tener que desplazarse entre las publicaciones ya existentes.
      setChanges((previous) => ({ ...previous, created: [post, ...previous.created] }))
    },
    [userId],
  )

  const update = useCallback(async (post: Post, values: PostFormValues) => {
    const updated = await updatePost(post, values)

    setChanges((previous) => ({
      ...previous,
      edited: { ...previous.edited, [post.id]: updated },
    }))
  }, [])

  const remove = useCallback(async (post: Post) => {
    await deletePost(post)

    setChanges((previous) => ({ ...previous, deleted: [...previous.deleted, post.id] }))
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

  // Las creadas se guardan todas juntas, así que hay que quedarse con las de
  // este usuario. Las editadas y borradas se indexan por id, que ya es único.
  const createdForUser = changes.created.filter((post) => post.userId === userId)

  const posts = [...createdForUser, ...remote.data]
    .filter((post) => !changes.deleted.includes(post.id))
    .map((post) => changes.edited[post.id] ?? post)

  return { state: { status: 'success', posts }, create, update, remove }
}
