const BASE_URL = 'https://jsonplaceholder.typicode.com'

/** Error de red o de respuesta HTTP, con el status cuando el servidor contestó. */
export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

/**
 * Envoltorio tipado sobre `fetch`.
 *
 * `fetch` sólo rechaza ante fallos de red: un 404 o un 500 resuelven
 * normalmente y, sin esta comprobación, la aplicación intentaría pintar una
 * página de error como si fueran datos. Aquí todo lo que no sea 2xx se
 * convierte en `ApiError`, de modo que quien llama sólo tiene que distinguir
 * entre resolver y rechazar.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  let response: Response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    // Una petición cancelada no es un error que mostrar: se propaga tal cual
    // para que quien llama pueda ignorarla.
    if (cause instanceof Error && cause.name === 'AbortError') {
      throw cause
    }
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión a internet.')
  }

  if (!response.ok) {
    throw new ApiError(
      `El servidor respondió con un error (${response.status}). Inténtalo de nuevo.`,
      response.status,
    )
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('La respuesta del servidor no tiene un formato válido.')
  }
}
