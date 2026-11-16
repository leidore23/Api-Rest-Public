import { vi } from 'vitest'
import type { User } from '../types'

export const users: User[] = [
  {
    id: 1,
    name: 'Leanne Graham',
    username: 'Bret',
    email: 'Sincere@april.biz',
    company: { name: 'Romaguera-Crona' },
  },
  {
    id: 2,
    name: 'Ervin Howell',
    username: 'Antonette',
    email: 'Shanna@melissa.tv',
    company: { name: 'Deckow-Crist' },
  },
  {
    id: 3,
    name: 'Clementine Bauch',
    username: 'Samantha',
    email: 'Nathan@yesenia.net',
    company: { name: 'Romaguera-Jacobson' },
  },
]

/**
 * Publicaciones con la forma cruda de la API, con `id` numérico: es lo que
 * recibe `fetchPostsByUser` antes de normalizar.
 */
export const apiPosts = [
  { userId: 1, id: 1, title: 'Primera publicación', body: 'Cuerpo de la primera.' },
  { userId: 1, id: 2, title: 'Segunda publicación', body: 'Cuerpo de la segunda.' },
]

/** Respuesta correcta con el cuerpo serializado, como la devolvería la API. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

interface StubApiOptions {
  postsByUser?: Record<number, unknown>
}

/**
 * Sustituye `fetch` por un doble que responde según la ruta pedida, para que
 * un test que toca usuarios y publicaciones no dependa del orden de llamada.
 */
export function stubApi({ postsByUser = { 1: apiPosts } }: StubApiOptions = {}) {
  const spy = vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input)

    // La API responde a POST con el eco de lo enviado y el id fijo 101.
    if (init?.method === 'POST') {
      const sent = JSON.parse(String(init.body)) as Record<string, unknown>
      return jsonResponse({ ...sent, id: 101 }, 201)
    }

    if (url.includes('/posts?userId=')) {
      const userId = Number(url.split('userId=')[1])
      return jsonResponse(postsByUser[userId] ?? [])
    }

    return jsonResponse(users)
  })

  vi.stubGlobal('fetch', spy)

  return spy
}
