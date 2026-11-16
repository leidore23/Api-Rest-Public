import type { User } from '../types'
import { request } from './client'

/**
 * Trae el listado completo de usuarios.
 *
 * Son diez, así que se descargan de una vez y la búsqueda por nombre se filtra
 * en cliente. JSONPlaceholder no admite búsquedas parciales (`?name_like=` es
 * de json-server, no de esta API), y consultar al servidor en cada pulsación
 * para diez registros sería más lento y más frágil.
 */
export function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  return request<User[]>('/users', { signal })
}
