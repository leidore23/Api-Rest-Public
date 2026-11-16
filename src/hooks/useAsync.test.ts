import { act, renderHook, waitFor } from '@testing-library/react'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('empieza cargando y expone los datos cuando la tarea resuelve', async () => {
    const { result } = renderHook(() => useAsync(async () => 'publicaciones', []))

    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current).toMatchObject({ status: 'success', data: 'publicaciones' })
  })

  it('expone el mensaje del error cuando la tarea falla', async () => {
    const { result } = renderHook(() =>
      useAsync(async () => {
        throw new Error('No se pudo conectar con el servidor.')
      }, []),
    )

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({
      status: 'error',
      message: 'No se pudo conectar con el servidor.',
    })
  })

  it('vuelve a ejecutar la tarea al llamar a reload', async () => {
    const task = vi.fn(async () => 'datos')
    const { result } = renderHook(() => useAsync(task, []))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(task).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.reload()
    })

    await waitFor(() => expect(task).toHaveBeenCalledTimes(2))
  })

  it('descarta la respuesta de una petición que quedó obsoleta', async () => {
    const resolvers = new Map<number, (value: string) => void>()
    const start = (id: number) =>
      new Promise<string>((resolve) => {
        resolvers.set(id, resolve)
      })

    const { result, rerender } = renderHook(({ id }) => useAsync(() => start(id), [id]), {
      initialProps: { id: 1 },
    })

    // Se cambia de usuario antes de que conteste la primera petición.
    rerender({ id: 2 })

    await act(async () => {
      resolvers.get(1)?.('respuesta vieja')
    })

    // La respuesta tardía de la petición cancelada no debe pintar nada.
    expect(result.current.status).toBe('loading')

    await act(async () => {
      resolvers.get(2)?.('respuesta nueva')
    })

    expect(result.current).toMatchObject({ status: 'success', data: 'respuesta nueva' })
  })
})
