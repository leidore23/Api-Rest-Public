import { filterUsersByName } from './filterUsersByName'
import { users } from '../test/fixtures'

describe('filterUsersByName', () => {
  it('devuelve la lista completa cuando la búsqueda está vacía', () => {
    expect(filterUsersByName(users, '')).toHaveLength(users.length)
    expect(filterUsersByName(users, '   ')).toHaveLength(users.length)
  })

  it('encuentra por coincidencia parcial y sin distinguir mayúsculas', () => {
    const result = filterUsersByName(users, 'LEANNE')

    expect(result.map((user) => user.name)).toEqual(['Leanne Graham'])
  })

  it('encuentra también por el apellido', () => {
    const result = filterUsersByName(users, 'howell')

    expect(result.map((user) => user.name)).toEqual(['Ervin Howell'])
  })

  it('ignora las tildes al comparar', () => {
    const conTilde = [{ ...users[0], name: 'José Álvarez' }]

    expect(filterUsersByName(conTilde, 'jose')).toHaveLength(1)
    expect(filterUsersByName(conTilde, 'alvarez')).toHaveLength(1)
  })

  it('devuelve una lista vacía cuando nada coincide', () => {
    expect(filterUsersByName(users, 'zzzz')).toEqual([])
  })
})
