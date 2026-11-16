import { validatePost } from './validatePost'

describe('validatePost', () => {
  it('no devuelve errores cuando ambos campos tienen contenido', () => {
    expect(validatePost({ title: 'Un título', body: 'Un texto' })).toEqual({})
  })

  it('exige el título', () => {
    const errors = validatePost({ title: '', body: 'Un texto' })

    expect(errors.title).toMatch(/obligatorio/i)
    expect(errors.body).toBeUndefined()
  })

  it('exige el texto', () => {
    const errors = validatePost({ title: 'Un título', body: '' })

    expect(errors.body).toMatch(/obligatorio/i)
    expect(errors.title).toBeUndefined()
  })

  it('trata como vacío un campo con sólo espacios', () => {
    const errors = validatePost({ title: '   ', body: '\n  \t ' })

    expect(errors.title).toMatch(/obligatorio/i)
    expect(errors.body).toMatch(/obligatorio/i)
  })
})
