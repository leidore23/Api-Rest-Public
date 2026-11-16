import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserForm } from './UserForm'

describe('UserForm', () => {
  it('no envía y señala los campos obligatorios vacíos', async () => {
    const onSubmit = vi.fn()
    render(<UserForm onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: /crear usuario/i }))

    expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/el nombre de usuario es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/el email es obligatorio/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('no exige la empresa', async () => {
    const onSubmit = vi.fn()
    render(<UserForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/^nombre$/i), 'Ada Lovelace')
    await userEvent.type(screen.getByLabelText(/nombre de usuario/i), 'ada')
    await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await userEvent.click(screen.getByRole('button', { name: /crear usuario/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      company: '',
    })
  })

  it('rechaza un email mal formado y lo describe en el campo', async () => {
    const onSubmit = vi.fn()
    render(<UserForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/^nombre$/i), 'Ada')
    await userEvent.type(screen.getByLabelText(/nombre de usuario/i), 'ada')
    await userEvent.type(screen.getByLabelText(/email/i), 'esto-no-es-un-email')
    await userEvent.click(screen.getByRole('button', { name: /crear usuario/i }))

    const email = screen.getByLabelText(/email/i)
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription(/formato/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('lleva el foco al primer campo inválido', async () => {
    render(<UserForm onSubmit={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /crear usuario/i }))

    expect(screen.getByLabelText(/^nombre$/i)).toHaveFocus()
  })

  it('parte de los valores recibidos cuando se usa para editar', () => {
    render(
      <UserForm
        onSubmit={vi.fn()}
        legend="Editar usuario"
        submitLabel="Guardar"
        initialValues={{
          name: 'Ada Lovelace',
          username: 'ada',
          email: 'ada@example.com',
          company: 'Analytical Engines',
        }}
      />,
    )

    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('Ada Lovelace')
    expect(screen.getByLabelText(/empresa/i)).toHaveValue('Analytical Engines')
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
  })
})
