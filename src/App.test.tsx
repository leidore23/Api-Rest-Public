import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { apiPosts, jsonResponse, stubApi, users } from './test/fixtures'

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
    stubApi()

    render(<App />)

    expect(await screen.findByRole('button', { name: /leanne graham/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ervin howell/i })).toBeInTheDocument()
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

    expect(await screen.findByRole('button', { name: /leanne graham/i })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('filtra la lista al escribir en el buscador', async () => {
    stubApi()

    render(<App />)
    await screen.findByRole('button', { name: /leanne graham/i })

    await userEvent.type(screen.getByRole('searchbox', { name: /buscar por nombre/i }), 'howell')

    expect(screen.getByRole('button', { name: /ervin howell/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /leanne graham/i })).not.toBeInTheDocument()
  })

  it('avisa cuando la búsqueda no encuentra ningún usuario', async () => {
    stubApi()

    render(<App />)
    await screen.findByRole('button', { name: /leanne graham/i })

    await userEvent.type(screen.getByRole('searchbox', { name: /buscar por nombre/i }), 'nadie')

    expect(screen.getByText(/ningún usuario coincide/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /leanne graham/i })).not.toBeInTheDocument()
  })

  it('muestra las publicaciones del usuario elegido', async () => {
    stubApi()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /leanne graham/i }))

    expect(
      await screen.findByRole('heading', { name: /publicaciones de leanne graham/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /primera publicación/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /segunda publicación/i })).toBeInTheDocument()
  })

  it('marca como seleccionado el usuario elegido', async () => {
    stubApi()

    render(<App />)
    const leanne = await screen.findByRole('button', { name: /leanne graham/i })
    await userEvent.click(leanne)

    expect(leanne).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /ervin howell/i })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('avisa si el usuario elegido no tiene publicaciones', async () => {
    stubApi({ postsByUser: { 1: [] } })

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /leanne graham/i }))

    expect(await screen.findByText(/todavía no tiene publicaciones/i)).toBeInTheDocument()
  })

  it('un fallo al cargar publicaciones no tumba la lista de usuarios', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (String(input).includes('/posts')) {
          return jsonResponse('Error del servidor', 500)
        }
        return jsonResponse(users)
      }),
    )

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /leanne graham/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/\(500\)/)
    expect(screen.getByRole('button', { name: /ervin howell/i })).toBeInTheDocument()
  })
  it('añade a la lista la publicación creada en el formulario', async () => {
    stubApi()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.type(screen.getByLabelText(/título/i), 'Mi publicación nueva')
    await userEvent.type(screen.getByLabelText(/texto/i), 'El cuerpo de la publicación.')
    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))

    expect(
      await screen.findByRole('heading', { name: /mi publicación nueva/i }),
    ).toBeInTheDocument()

    // Debe aparecer la primera, antes de las que ya existían.
    const titulos = screen.getAllByRole('heading', { level: 3 }).map((nodo) => nodo.textContent)
    expect(titulos[0]).toBe('Mi publicación nueva')
  })

  it('vacía el formulario después de publicar', async () => {
    stubApi()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.type(screen.getByLabelText(/título/i), 'Algo')
    await userEvent.type(screen.getByLabelText(/texto/i), 'Un cuerpo')
    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))

    await screen.findByRole('heading', { name: /^algo$/i })
    expect(screen.getByLabelText(/título/i)).toHaveValue('')
    expect(screen.getByLabelText(/texto/i)).toHaveValue('')
  })

  it('conserva lo escrito y avisa si falla la creación', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return jsonResponse('Error del servidor', 500)
        }
        if (String(input).includes('/posts?userId=')) {
          return jsonResponse(apiPosts)
        }
        return jsonResponse(users)
      }),
    )

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.type(screen.getByLabelText(/título/i), 'No se va a guardar')
    await userEvent.type(screen.getByLabelText(/texto/i), 'Cuerpo')
    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/\(500\)/)
    expect(screen.getByLabelText(/título/i)).toHaveValue('No se va a guardar')
  })
})
