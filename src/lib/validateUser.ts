export interface UserFormValues {
  name: string
  username: string
  email: string
  company: string
}

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>

/**
 * Comprobación deliberadamente laxa del email: un carácter, arroba, dominio
 * con punto. Las expresiones regulares que intentan implementar el RFC 5322
 * son enormes y rechazan direcciones válidas; lo único que puede confirmar que
 * un email existe es enviarle un correo. Aquí basta con atajar el error de
 * tecleo evidente.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateUser(values: UserFormValues): UserFormErrors {
  const errors: UserFormErrors = {}

  if (values.name.trim() === '') {
    errors.name = 'El nombre es obligatorio.'
  }

  if (values.username.trim() === '') {
    errors.username = 'El nombre de usuario es obligatorio.'
  }

  if (values.email.trim() === '') {
    errors.email = 'El email es obligatorio.'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'El email no tiene un formato válido.'
  }

  // La empresa no es obligatoria: la API la trae para los diez usuarios
  // existentes, pero no es un dato que se le pueda exigir a nadie.
  return errors
}
