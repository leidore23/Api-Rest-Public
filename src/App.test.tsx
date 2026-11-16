import { render, screen, waitFor, within } from '@testing-library/react'
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

    expect(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ver publicaciones de ervin howell/i })).toBeInTheDocument()
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

    expect(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('filtra la lista al escribir en el buscador', async () => {
    stubApi()

    render(<App />)
    await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })

    await userEvent.type(screen.getByRole('searchbox', { name: /buscar por nombre/i }), 'howell')

    expect(screen.getByRole('button', { name: /ver publicaciones de ervin howell/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ver publicaciones de leanne graham/i })).not.toBeInTheDocument()
  })

  it('avisa cuando la búsqueda no encuentra ningún usuario', async () => {
    stubApi()

    render(<App />)
    await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })

    await userEvent.type(screen.getByRole('searchbox', { name: /buscar por nombre/i }), 'nadie')

    expect(screen.getByText(/ningún usuario coincide/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ver publicaciones de leanne graham/i })).not.toBeInTheDocument()
  })

  it('muestra las publicaciones del usuario elegido', async () => {
    stubApi()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))

    expect(
      await screen.findByRole('heading', { name: /publicaciones de leanne graham/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /primera publicación/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /segunda publicación/i })).toBeInTheDocument()
  })

  it('marca como seleccionado el usuario elegido', async () => {
    stubApi()

    render(<App />)
    const leanne = await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })
    await userEvent.click(leanne)

    expect(leanne).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /ver publicaciones de ervin howell/i })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('avisa si el usuario elegido no tiene publicaciones', async () => {
    stubApi({ postsByUser: { 1: [] } })

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))

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
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/\(500\)/)
    expect(screen.getByRole('button', { name: /ver publicaciones de ervin howell/i })).toBeInTheDocument()
  })
  it('añade a la lista la publicación creada en el formulario', async () => {
    stubApi()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
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
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
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
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.type(screen.getByLabelText(/título/i), 'No se va a guardar')
    await userEvent.type(screen.getByLabelText(/texto/i), 'Cuerpo')
    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/\(500\)/)
    expect(screen.getByLabelText(/título/i)).toHaveValue('No se va a guardar')
  })
  it('edita una publicación existente y conserva el cambio', async () => {
    const fetchSpy = stubApi()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.click(screen.getByRole('button', { name: /editar: primera publicación/i }))

    const formularioEdicion = within(screen.getByRole('form', { name: /editar publicación/i }))
    const titulo = formularioEdicion.getByLabelText(/título/i)
    await userEvent.clear(titulo)
    await userEvent.type(titulo, 'Título corregido')
    await userEvent.click(formularioEdicion.getByRole('button', { name: /guardar/i }))

    expect(await screen.findByRole('heading', { name: /título corregido/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /primera publicación/i })).not.toBeInTheDocument()

    // Debe haberse pedido el PUT, porque la publicación venía del servidor.
    const metodos = fetchSpy.mock.calls.map(([, init]) => (init as RequestInit | undefined)?.method)
    expect(metodos).toContain('PUT')
  })

  it('no llama a la API al editar una publicación creada en cliente', async () => {
    const fetchSpy = stubApi()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.type(screen.getByLabelText(/título/i), 'Recién creada')
    await userEvent.type(screen.getByLabelText(/texto/i), 'Un cuerpo')
    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))
    await screen.findByRole('heading', { name: /recién creada/i })

    await userEvent.click(screen.getByRole('button', { name: /editar: recién creada/i }))

    const formularioEdicion = within(screen.getByRole('form', { name: /editar publicación/i }))
    const titulo = formularioEdicion.getByLabelText(/título/i)
    await userEvent.clear(titulo)
    await userEvent.type(titulo, 'Editada en local')
    await userEvent.click(formularioEdicion.getByRole('button', { name: /guardar/i }))

    expect(await screen.findByRole('heading', { name: /editada en local/i })).toBeInTheDocument()

    // PUT sobre un id local devolvería 404: no debe pedirse.
    const metodos = fetchSpy.mock.calls.map(([, init]) => (init as RequestInit | undefined)?.method)
    expect(metodos).not.toContain('PUT')
  })

  it('pide confirmación antes de borrar y luego la quita de la lista', async () => {
    stubApi()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.click(screen.getByRole('button', { name: /borrar: primera publicación/i }))

    // Todavía no se ha borrado nada: primero hay que confirmar.
    expect(screen.getByRole('heading', { name: /primera publicación/i })).toBeInTheDocument()
    expect(screen.getByText(/¿borrar esta publicación\?/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /sí, borrar/i }))

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /primera publicación/i })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('heading', { name: /segunda publicación/i })).toBeInTheDocument()
  })

  it('permite cancelar el borrado', async () => {
    stubApi()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.click(screen.getByRole('button', { name: /borrar: primera publicación/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.getByRole('heading', { name: /primera publicación/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /borrar: primera publicación/i })).toBeInTheDocument()
  })
  it('conserva las publicaciones creadas al volver a montar la aplicación', async () => {
    stubApi()

    const primera = render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.type(screen.getByLabelText(/título/i), 'Sobrevive a la recarga')
    await userEvent.type(screen.getByLabelText(/texto/i), 'Guardada en localStorage')
    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))
    await screen.findByRole('heading', { name: /sobrevive a la recarga/i })

    // Equivale a recargar la página: se desmonta todo y se vuelve a montar.
    primera.unmount()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))

    expect(
      await screen.findByRole('heading', { name: /sobrevive a la recarga/i }),
    ).toBeInTheDocument()
  })

  it('no mezcla las publicaciones creadas entre usuarios distintos', async () => {
    stubApi({ postsByUser: { 1: apiPosts, 2: [] } })

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.type(screen.getByLabelText(/título/i), 'Solo de Leanne')
    await userEvent.type(screen.getByLabelText(/texto/i), 'Cuerpo')
    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))
    await screen.findByRole('heading', { name: /solo de leanne/i })

    await userEvent.click(screen.getByRole('button', { name: /ver publicaciones de ervin howell/i }))

    expect(await screen.findByText(/todavía no tiene publicaciones/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /solo de leanne/i })).not.toBeInTheDocument()
  })

  it('conserva el borrado de una publicación al volver a montar', async () => {
    stubApi()

    const primera = render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
    await screen.findByRole('heading', { name: /primera publicación/i })

    await userEvent.click(screen.getByRole('button', { name: /borrar: primera publicación/i }))
    await userEvent.click(screen.getByRole('button', { name: /sí, borrar/i }))
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /primera publicación/i })).not.toBeInTheDocument(),
    )

    primera.unmount()

    render(<App />)
    await userEvent.click(await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }))
    await screen.findByRole('heading', { name: /segunda publicación/i })

    expect(screen.queryByRole('heading', { name: /primera publicación/i })).not.toBeInTheDocument()
  })
  it('crea un usuario y lo muestra al principio de la lista', async () => {
    stubApi()

    render(<App />)
    await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })

    await userEvent.click(screen.getByRole('button', { name: /añadir usuario/i }))
    await userEvent.type(screen.getByLabelText(/^nombre$/i), 'Ada Lovelace')
    await userEvent.type(screen.getByLabelText(/nombre de usuario/i), 'ada')
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await userEvent.click(screen.getByRole('button', { name: /crear usuario/i }))

    expect(
      await screen.findByRole('button', { name: /ver publicaciones de ada lovelace/i }),
    ).toBeInTheDocument()

    const nombres = screen
      .getAllByRole('button', { name: /^ver publicaciones de/i })
      .map((nodo) => nodo.getAttribute('aria-label'))
    expect(nombres[0]).toBe('Ver publicaciones de Ada Lovelace')
  })

  it('edita un usuario existente y pide el PUT a la API', async () => {
    const fetchSpy = stubApi()

    render(<App />)
    await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })

    await userEvent.click(screen.getByRole('button', { name: /editar: leanne graham/i }))

    const formulario = within(screen.getByRole('form', { name: /editar usuario/i }))
    const nombre = formulario.getByLabelText(/^nombre$/i)
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'Leanne Corregida')
    await userEvent.click(formulario.getByRole('button', { name: /guardar/i }))

    expect(
      await screen.findByRole('button', { name: /ver publicaciones de leanne corregida/i }),
    ).toBeInTheDocument()

    const metodos = fetchSpy.mock.calls.map(([, init]) => (init as RequestInit | undefined)?.method)
    expect(metodos).toContain('PUT')
  })

  it('no llama a la API al editar un usuario creado en cliente', async () => {
    const fetchSpy = stubApi()

    render(<App />)
    await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })

    await userEvent.click(screen.getByRole('button', { name: /añadir usuario/i }))
    await userEvent.type(screen.getByLabelText(/^nombre$/i), 'Ada Lovelace')
    await userEvent.type(screen.getByLabelText(/nombre de usuario/i), 'ada')
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await userEvent.click(screen.getByRole('button', { name: /crear usuario/i }))
    await screen.findByRole('button', { name: /ver publicaciones de ada lovelace/i })

    await userEvent.click(screen.getByRole('button', { name: /editar: ada lovelace/i }))
    const formulario = within(screen.getByRole('form', { name: /editar usuario/i }))
    const nombre = formulario.getByLabelText(/^nombre$/i)
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'Ada Editada')
    await userEvent.click(formulario.getByRole('button', { name: /guardar/i }))

    await screen.findByRole('button', { name: /ver publicaciones de ada editada/i })

    const metodos = fetchSpy.mock.calls.map(([, init]) => (init as RequestInit | undefined)?.method)
    expect(metodos).not.toContain('PUT')
  })

  it('pide confirmación antes de borrar un usuario y luego lo quita', async () => {
    stubApi()

    render(<App />)
    await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })

    await userEvent.click(screen.getByRole('button', { name: /borrar: leanne graham/i }))
    expect(
      screen.getByRole('button', { name: /ver publicaciones de leanne graham/i }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /sí, borrar/i }))

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /ver publicaciones de leanne graham/i }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole('button', { name: /ver publicaciones de ervin howell/i }),
    ).toBeInTheDocument()
  })

  it('cierra el panel de publicaciones si se borra el usuario seleccionado', async () => {
    stubApi()

    render(<App />)
    await userEvent.click(
      await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i }),
    )
    await screen.findByRole('heading', { name: /publicaciones de leanne graham/i })

    await userEvent.click(screen.getByRole('button', { name: /borrar: leanne graham/i }))
    await userEvent.click(screen.getByRole('button', { name: /sí, borrar/i }))

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: /publicaciones de leanne graham/i }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByText(/elige un usuario/i)).toBeInTheDocument()
  })

  it('conserva los usuarios creados al volver a montar la aplicación', async () => {
    stubApi()

    const primera = render(<App />)
    await screen.findByRole('button', { name: /ver publicaciones de leanne graham/i })

    await userEvent.click(screen.getByRole('button', { name: /añadir usuario/i }))
    await userEvent.type(screen.getByLabelText(/^nombre$/i), 'Ada Lovelace')
    await userEvent.type(screen.getByLabelText(/nombre de usuario/i), 'ada')
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await userEvent.click(screen.getByRole('button', { name: /crear usuario/i }))
    await screen.findByRole('button', { name: /ver publicaciones de ada lovelace/i })

    primera.unmount()
    render(<App />)

    expect(
      await screen.findByRole('button', { name: /ver publicaciones de ada lovelace/i }),
    ).toBeInTheDocument()
  })
})
