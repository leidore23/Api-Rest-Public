import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { installLocalStorageIfBroken } from './memoryStorage'

installLocalStorageIfBroken()

// jsdom comparte el mismo `localStorage` entre los tests de un archivo. Sin
// limpiarlo, una publicación creada en un test se filtra al siguiente y los
// fallos dependen del orden de ejecución.
beforeEach(() => {
  localStorage.clear()
})

// Desmonta lo renderizado para que cada test parta de un DOM vacío.
afterEach(() => {
  cleanup()
})
