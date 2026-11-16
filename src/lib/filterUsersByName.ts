import type { User } from '../types'

/**
 * Deja el texto comparable: sin mayúsculas y sin tildes, de modo que buscar
 * "jose" encuentre también "José". La API devuelve nombres en inglés, pero
 * quien usa la aplicación escribe en castellano y espera que la tilde no
 * cambie el resultado.
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/**
 * Filtra los usuarios por coincidencia parcial en el nombre.
 *
 * Se hace en cliente porque los diez usuarios ya están descargados: consultar
 * al servidor en cada pulsación añadiría latencia y un estado de carga
 * parpadeante para filtrar una lista que ya está en memoria. Es una función
 * pura y aparte del componente para poder probarla sin renderizar nada.
 */
export function filterUsersByName(users: User[], query: string): User[] {
  const normalizedQuery = normalize(query.trim())

  if (normalizedQuery === '') {
    return users
  }

  return users.filter((user) => normalize(user.name).includes(normalizedQuery))
}
