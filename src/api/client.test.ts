import { ApiError, request } from './client'

function stubFetch(implementation: () => Promise<Response>) {
  const spy = vi.fn(implementation)
  vi.stubGlobal('fetch', spy)
  return spy
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request', () => {
  it('llama a la URL completa de la API y devuelve los datos parseados', async () => {
    const fetchSpy = stubFetch(async () => new Response(JSON.stringify([{ id: 1 }]), { status: 200 }))

    await expect(request('/users')).resolves.toEqual([{ id: 1 }])
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://jsonplaceholder.typicode.com/users',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('convierte una respuesta de error en ApiError conservando el status', async () => {
    stubFetch(async () => new Response('No encontrado', { status: 404 }))

    const error = await request('/users/999').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
  })

  it('convierte un fallo de red en un ApiError con mensaje de conexión', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    await expect(request('/users')).rejects.toThrow(/conexión/i)
  })

  it('propaga la cancelación sin envolverla en ApiError', async () => {
    stubFetch(async () => {
      const abortError = new Error('The operation was aborted.')
      abortError.name = 'AbortError'
      throw abortError
    })

    const error = await request('/users').catch((caught: unknown) => caught)

    expect(error).not.toBeInstanceOf(ApiError)
    expect((error as Error).name).toBe('AbortError')
  })
})
