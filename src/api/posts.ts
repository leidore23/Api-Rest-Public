import { createId } from '../lib/createId'
import type { PostFormValues } from '../lib/validatePost'
import type { Post } from '../types'
import { request } from './client'

/** Forma cruda que devuelve la API, con el id numérico. */
interface ApiPost {
  userId: number
  id: number
  title: string
  body: string
}

/**
 * Traduce la publicación de la API al modelo de la aplicación.
 *
 * El único cambio es el `id`, que pasa a `string`. Hacerlo aquí, en el borde,
 * deja el resto de la aplicación con un solo tipo de identificador: las
 * publicaciones que lleguen del servidor y las que se creen en cliente son
 * indistinguibles para la interfaz.
 */
function toPost(apiPost: ApiPost): Post {
  return {
    id: String(apiPost.id),
    userId: String(apiPost.userId),
    title: apiPost.title,
    body: apiPost.body,
    origin: 'server',
  }
}

export async function fetchPostsByUser(userId: string, signal?: AbortSignal): Promise<Post[]> {
  const apiPosts = await request<ApiPost[]>(`/posts?userId=${userId}`, { signal })

  return apiPosts.map(toPost)
}

export interface NewPostInput {
  userId: string
  title: string
  body: string
}

/**
 * Crea una publicación.
 *
 * Se llama de verdad a la API para que el formulario tenga estados de envío y
 * error reales, pero la respuesta se descarta: JSONPlaceholder no guarda nada
 * y devuelve siempre `id: 101`. La publicación que vuelve lleva un
 * identificador generado en cliente.
 */
export async function createPost(input: NewPostInput): Promise<Post> {
  await request<ApiPost>('/posts', { method: 'POST', body: input })

  return { id: createId(), origin: 'local', ...input }
}

/**
 * Guarda los cambios de una publicación.
 *
 * Sólo se llama a la API si la publicación vino de ella. Las creadas en esta
 * sesión no existen en el servidor y `PUT /posts/<id-local>` responde 404, así
 * que pedirlo sería provocar un error a propósito para luego ignorarlo.
 */
export async function updatePost(post: Post, values: PostFormValues): Promise<Post> {
  if (post.origin === 'server') {
    await request<ApiPost>(`/posts/${post.id}`, {
      method: 'PUT',
      body: { id: Number(post.id), userId: post.userId, ...values },
    })
  }

  return { ...post, ...values }
}

/**
 * Borra una publicación.
 *
 * A diferencia de `PUT`, la API responde 200 a `DELETE` con cualquier id, pero
 * se mantiene la misma condición: no tiene sentido pedir al servidor que borre
 * algo que nunca llegó a recibir.
 */
export async function deletePost(post: Post): Promise<void> {
  if (post.origin === 'server') {
    await request<unknown>(`/posts/${post.id}`, { method: 'DELETE' })
  }
}
