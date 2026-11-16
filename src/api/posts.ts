import { createId } from '../lib/createId'
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
    userId: apiPost.userId,
    title: apiPost.title,
    body: apiPost.body,
  }
}

export async function fetchPostsByUser(userId: number, signal?: AbortSignal): Promise<Post[]> {
  const apiPosts = await request<ApiPost[]>(`/posts?userId=${userId}`, { signal })

  return apiPosts.map(toPost)
}

export interface NewPostInput {
  userId: number
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

  return { id: createId(), ...input }
}
