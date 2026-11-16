export interface PostFormValues {
  title: string
  body: string
}

export type PostFormErrors = Partial<Record<keyof PostFormValues, string>>

/**
 * Valida los campos de una publicación.
 *
 * Devuelve un objeto con un mensaje por campo inválido, vacío si todo está
 * bien. Es una función pura y fuera del componente para poder probar las
 * reglas sin renderizar ni simular pulsaciones, y para que el día que haya
 * un formulario de edición use exactamente las mismas.
 *
 * Se compara contra el texto recortado: un título de sólo espacios está
 * vacío a todos los efectos, aunque `value !== ''`.
 */
export function validatePost(values: PostFormValues): PostFormErrors {
  const errors: PostFormErrors = {}

  if (values.title.trim() === '') {
    errors.title = 'El título es obligatorio.'
  }

  if (values.body.trim() === '') {
    errors.body = 'El texto es obligatorio.'
  }

  return errors
}
