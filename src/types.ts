/**
 * Usuario de /users. La API devuelve bastantes más campos (dirección,
 * coordenadas, teléfono, web); aquí se modelan sólo los que la interfaz
 * muestra, para que el tipo describa lo que la aplicación usa de verdad.
 */
export interface User {
  id: number
  name: string
  username: string
  email: string
  company: {
    name: string
  }
}

/**
 * Publicación ya normalizada para la interfaz.
 *
 * El `id` es `string` y no `number` como en la API: las publicaciones creadas
 * desde el formulario se identifican con un UUID generado en cliente, porque
 * `POST /posts` devuelve siempre `id: 101` y dos publicaciones nuevas
 * acabarían compartiendo identificador. Unificar el tipo en el borde de la API
 * evita arrastrar un `string | number` por toda la aplicación.
 */
export interface Post {
  id: string
  userId: number
  title: string
  body: string
}
