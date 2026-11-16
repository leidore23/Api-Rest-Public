import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { jsonResponse, users } from './test/fixtures'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('muestra el indicador de carga mientras llegan los usuarios', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    )

    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent(/cargando usuarios/i)
  })

  it('muestra la lista de usuarios cuando la petición responde', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(users)))

    render(<App />)

    expect(await screen.findByRole('heading', { name: /leanne graham/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /ervin howell/i })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('muestra un mensaje de error cuando la petición falla y permite reintentar', async () => {
    const fetchSpy = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(jsonResponse('Error del servidor', 500))
      .mockResolvedValueOnce(jsonResponse(users))
    vi.stubGlobal('fetch', fetchSpy)

    render(<App />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/el servidor respondió con un error \(500\)/i)

    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByRole('heading', { name: /leanne graham/i })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
  it('filtra la lista al escribir en el buscador', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(users)))

    render(<App />)
    await screen.findByRole('heading', { name: /leanne graham/i })

    await userEvent.type(
      screen.getByRole('searchbox', { name: /buscar por nombre/i }),
      'howell',
    )

    expect(screen.getByRole('heading', { name: /ervin howell/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /leanne graham/i })).not.toBeInTheDocument()
  })

  it('avisa cuando la búsqueda no encuentra ningún usuario', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(users)))

    render(<App />)
    await screen.findByRole('heading', { name: /leanne graham/i })

    await userEvent.type(
      screen.getByRole('searchbox', { name: /buscar por nombre/i }),
      'nadie',
    )

    expect(screen.getByText(/ningún usuario coincide/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /leanne graham/i })).not.toBeInTheDocument()
  })
})
