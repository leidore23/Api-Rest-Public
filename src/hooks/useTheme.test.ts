import { act, renderHook } from '@testing-library/react'
import { useTheme } from './useTheme'

afterEach(() => {
  delete document.documentElement.dataset.theme
  vi.unstubAllGlobals()
})

describe('useTheme', () => {
  it('sigue la preferencia del sistema cuando no hay ninguna guardada', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('da prioridad al tema guardado sobre el del sistema', () => {
    localStorage.setItem('jsonplaceholder-app:theme:v1', 'light')
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('alterna el tema y lo guarda', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))

    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')

    act(() => {
      result.current.toggle()
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('jsonplaceholder-app:theme:v1')).toBe('dark')
  })
})
