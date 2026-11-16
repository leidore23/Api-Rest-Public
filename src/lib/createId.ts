/**
 * Identificador para las publicaciones creadas en cliente.
 *
 * No se usa el `id` que devuelve `POST /posts` porque la API siempre responde
 * `101`: dos publicaciones nuevas compartirían identificador, React avisaría de
 * claves duplicadas y editar o borrar una afectaría a la otra.
 *
 * `crypto.randomUUID` no existe en contextos no seguros ni en algunos entornos
 * de prueba, así que hay una alternativa. No necesita ser criptográfica: sólo
 * distinguir publicaciones dentro de una misma sesión.
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
