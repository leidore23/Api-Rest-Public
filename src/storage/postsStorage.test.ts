import { readStoredPosts, writeStoredPosts } from './postsStorage'
import type { Post } from '../types'

const post: Post = {
  id: 'local-1',
  userId: 1,
  title: 'Guardada',
  body: 'Cuerpo',
  origin: 'local',
}

describe('postsStorage', () => {
  it('devuelve el estado vacío cuando no hay nada guardado', () => {
    expect(readStoredPosts()).toEqual({ created: [], edited: {}, deleted: [] })
  })

  it('guarda y recupera los cambios', () => {
    writeStoredPosts({ created: [post], edited: { '1': post }, deleted: ['2'] })

    expect(readStoredPosts()).toEqual({ created: [post], edited: { '1': post }, deleted: ['2'] })
  })

  it('devuelve el estado vacío si lo guardado no es JSON válido', () => {
    localStorage.setItem('jsonplaceholder-app:posts:v1', 'esto no es json')

    expect(readStoredPosts()).toEqual({ created: [], edited: {}, deleted: [] })
  })

  it('devuelve el estado vacío si lo guardado tiene otra forma', () => {
    localStorage.setItem('jsonplaceholder-app:posts:v1', JSON.stringify({ otraCosa: true }))

    expect(readStoredPosts()).toEqual({ created: [], edited: {}, deleted: [] })
  })

  it('no lanza cuando localStorage falla al escribir', () => {
    const original = localStorage.setItem
    localStorage.setItem = () => {
      throw new Error('Cuota superada')
    }

    expect(() => writeStoredPosts({ created: [post], edited: {}, deleted: [] })).not.toThrow()

    localStorage.setItem = original
  })
})
