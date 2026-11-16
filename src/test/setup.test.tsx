import { render, screen } from '@testing-library/react'

/**
 * Comprueba que el entorno de tests está bien montado antes de escribir los
 * tests de la aplicación: jsdom, el render de Testing Library, los matchers de
 * jest-dom y el aislamiento de `localStorage` entre tests.
 */
describe('entorno de tests', () => {
  it('renderiza componentes y aplica los matchers de jest-dom', () => {
    render(<h1>Hola</h1>)

    expect(screen.getByRole('heading', { name: 'Hola' })).toBeInTheDocument()
  })

  it('deja una publicación en localStorage', () => {
    localStorage.setItem('post', 'borrador')

    expect(localStorage.getItem('post')).toBe('borrador')
  })

  it('no arrastra el localStorage del test anterior', () => {
    expect(localStorage.getItem('post')).toBeNull()
  })
})
