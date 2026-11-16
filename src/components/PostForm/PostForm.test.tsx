import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostForm } from './PostForm'

describe('PostForm', () => {
  it('no envía y señala ambos campos cuando están vacíos', async () => {
    const onSubmit = vi.fn()
    render(<PostForm onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))

    expect(screen.getByText(/el título es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/el texto es obligatorio/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rechaza un título de sólo espacios', async () => {
    const onSubmit = vi.fn()
    render(<PostForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/título/i), '    ')
    await userEvent.type(screen.getByLabelText(/texto/i), 'Un texto válido')
    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))

    expect(screen.getByText(/el título es obligatorio/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('marca los campos inválidos y los describe con su mensaje', async () => {
    render(<PostForm onSubmit={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))

    const titulo = screen.getByLabelText(/título/i)
    expect(titulo).toHaveAttribute('aria-invalid', 'true')
    expect(titulo).toHaveAccessibleDescription(/el título es obligatorio/i)
  })

  it('lleva el foco al primer campo inválido', async () => {
    render(<PostForm onSubmit={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))

    expect(screen.getByLabelText(/título/i)).toHaveFocus()
  })

  it('retira el error en cuanto se corrige el campo', async () => {
    render(<PostForm onSubmit={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))
    expect(screen.getByText(/el título es obligatorio/i)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/título/i), 'Ya tiene título')

    expect(screen.queryByText(/el título es obligatorio/i)).not.toBeInTheDocument()
    expect(screen.getByText(/el texto es obligatorio/i)).toBeInTheDocument()
  })

  it('envía los valores recortados cuando el formulario es válido', async () => {
    const onSubmit = vi.fn()
    render(<PostForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/título/i), '  Mi título  ')
    await userEvent.type(screen.getByLabelText(/texto/i), '  Mi texto  ')
    await userEvent.click(screen.getByRole('button', { name: /publicar/i }))

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Mi título', body: 'Mi texto' })
  })
})
