import { validateUser } from './validateUser'

const valido = {
  name: 'Ada Lovelace',
  username: 'ada',
  email: 'ada@example.com',
  company: 'Analytical Engines',
}

describe('validateUser', () => {
  it('acepta un usuario completo', () => {
    expect(validateUser(valido)).toEqual({})
  })

  it('no exige la empresa', () => {
    expect(validateUser({ ...valido, company: '' })).toEqual({})
  })

  it('exige nombre, usuario y email', () => {
    const errors = validateUser({ name: '', username: '', email: '', company: '' })

    expect(errors.name).toMatch(/obligatorio/i)
    expect(errors.username).toMatch(/obligatorio/i)
    expect(errors.email).toMatch(/obligatorio/i)
  })

  it('trata como vacío un campo con sólo espacios', () => {
    expect(validateUser({ ...valido, name: '   ' }).name).toMatch(/obligatorio/i)
  })

  it('rechaza un email con formato incorrecto', () => {
    expect(validateUser({ ...valido, email: 'ada' }).email).toMatch(/formato/i)
    expect(validateUser({ ...valido, email: 'ada@ejemplo' }).email).toMatch(/formato/i)
    expect(validateUser({ ...valido, email: 'ada @ejemplo.com' }).email).toMatch(/formato/i)
  })
})
