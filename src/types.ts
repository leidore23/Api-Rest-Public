/**
 * De dónde salió un recurso.
 *
 * No es un detalle cosmético: decide si se puede llamar a la API. Lo creado en
 * esta sesión no existe en el servidor, así que `PUT` sobre ello devuelve 404
 * (comprobado contra la API real, tanto en `/posts` como en `/users`).
 * Marcarlo de forma explícita es preferible a deducirlo del formato del `id`,
 * que funciona por casualidad y se rompe en silencio.
 */
export type Origin = 'server' | 'local'

/**
 * Usuario de /users. La API devuelve bastantes más campos (dirección,
 * coordenadas, teléfono, web); aquí se modelan sólo los que la interfaz
 * muestra, para que el tipo describa lo que la aplicación usa de verdad.
 *
 * El `id` es `string` y no `number` como en la API: `POST /users` devuelve
 * siempre `id: 11`, así que los usuarios creados llevan un identificador
 * generado en cliente. Unificar el tipo en el borde de la API evita arrastrar
 * un `string | number` por toda la aplicación.
 */
export interface User {
  id: string
  name: string
  username: string
  email: string
  company: {
    name: string
  }
  origin: Origin
}

/**
 * Publicación ya normalizada para la interfaz.
 *
 * Mismo criterio que con los usuarios: `POST /posts` devuelve siempre
 * `id: 101`, de modo que dos publicaciones nuevas compartirían identificador.
 */
export interface Post {
  id: string
  userId: string
  title: string
  body: string
  origin: Origin
}
