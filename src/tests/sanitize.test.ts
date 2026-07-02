import { describe, it, expect } from 'vitest'
import { sanitizeInPlace } from '../middlewares/sanitize.js'

describe('sanitizeInPlace', () => {
  it('elimina claves que empiezan con $', () => {
    const body = { email: { $gt: '' }, password: 'secret' }
    sanitizeInPlace(body)
    expect(body).toEqual({ email: {}, password: 'secret' })
  })

  it('elimina claves con punto (dot notation)', () => {
    const body = { 'user.role': 'admin', name: 'ok' }
    sanitizeInPlace(body)
    expect(body).toEqual({ name: 'ok' })
  })

  it('sanitiza objetos anidados', () => {
    const body = {
      filters: { price: { $ne: 0 }, brand: 'sony' },
    }
    sanitizeInPlace(body)
    expect(body).toEqual({ filters: { price: {}, brand: 'sony' } })
  })

  it('sanitiza objetos dentro de arrays', () => {
    const body = { items: [{ $where: 'true', id: '1' }, { id: '2' }] }
    sanitizeInPlace(body)
    expect(body).toEqual({ items: [{ id: '1' }, { id: '2' }] })
  })

  it('no toca valores primitivos ni strings con $', () => {
    const body = { name: '$100 product', price: 100, active: true }
    sanitizeInPlace(body)
    expect(body).toEqual({ name: '$100 product', price: 100, active: true })
  })

  it('tolera null y undefined sin explotar', () => {
    expect(() => sanitizeInPlace(null)).not.toThrow()
    expect(() => sanitizeInPlace(undefined)).not.toThrow()
  })

  it('muta las propiedades sin reasignar el objeto (compat Express 5)', () => {
    const query = { brand: 'sony', $where: 'x' }
    const ref = query
    sanitizeInPlace(query)
    expect(query).toBe(ref)
    expect(query).toEqual({ brand: 'sony' })
  })
})
