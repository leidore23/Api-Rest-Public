import { createId } from '../lib/createId'
import type { UserFormValues } from '../lib/validateUser'
import type { User } from '../types'
import { request } from './client'

/** Forma cruda que devuelve la API, con el id numérico. */
interface ApiUser {
  id: number
  name: string
  username: string
  email: string
  company?: { name?: string }
}

function toUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    name: apiUser.name,
    username: apiUser.username,
    email: apiUser.email,
    company: { name: apiUser.company?.name ?? '' },
    origin: 'server',
  }
}

/** Pasa los valores planos del formulario a la forma anidada del dominio. */
function fromValues(values: UserFormValues) {
  return {
    name: values.name,
    username: values.username,
    email: values.email,
    company: { name: values.company },
  }
}

/**
 * Trae el listado completo de usuarios.
 *
 * Son diez, así que se descargan de una vez y la búsqueda por nombre se filtra
 * en cliente. JSONPlaceholder no admite búsquedas parciales (`?name_like=` es
 * de json-server, no de esta API), y consultar al servidor en cada pulsación
 * para diez registros sería más lento y más frágil.
 */
export async function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  const apiUsers = await request<ApiUser[]>('/users', { signal })

  return apiUsers.map(toUser)
}

/**
 * Crea un usuario.
 *
 * Igual que con las publicaciones: se llama de verdad a la API para tener
 * estados de envío y error reales, pero su respuesta se descarta, porque
 * devuelve siempre `id: 11`.
 */
export async function createUser(values: UserFormValues): Promise<User> {
  await request<ApiUser>('/users', { method: 'POST', body: values })

  return { id: createId(), origin: 'local', ...fromValues(values) }
}

/**
 * Guarda los cambios de un usuario.
 *
 * Sólo se llama a la API si el usuario vino de ella: `PUT /users/<id-local>`
 * responde 404, igual que en publicaciones.
 */
export async function updateUser(user: User, values: UserFormValues): Promise<User> {
  if (user.origin === 'server') {
    await request<ApiUser>(`/users/${user.id}`, {
      method: 'PUT',
      body: { id: Number(user.id), ...values },
    })
  }

  return { ...user, ...fromValues(values) }
}

/** Borra un usuario. Mismo criterio: no se pide borrar lo que nunca se envió. */
export async function deleteUser(user: User): Promise<void> {
  if (user.origin === 'server') {
    await request<unknown>(`/users/${user.id}`, { method: 'DELETE' })
  }
}
