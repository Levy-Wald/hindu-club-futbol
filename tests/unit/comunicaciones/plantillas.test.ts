import { describe, it, expect } from 'vitest'
import { renderTemplate } from '../../../modules/comunicaciones/lib/renderer'
import {
  extractVariablesFromTemplate,
  sincronizarVariablesDisponibles,
} from '../../../modules/comunicaciones/lib/plantillas/parser'

describe('renderTemplate', () => {
  it('reemplaza {{variable}} por su valor', () => {
    expect(renderTemplate('Hola {{nombre}}', { nombre: 'Juan' })).toBe('Hola Juan')
  })

  it('reemplaza todas las ocurrencias de una variable', () => {
    expect(renderTemplate('{{x}} y {{x}}', { x: 'A' })).toBe('A y A')
  })

  it('reemplaza múltiples variables distintas', () => {
    expect(
      renderTemplate('{{nombre}} debe {{monto}}', { nombre: 'Ana', monto: '$5.000' }),
    ).toBe('Ana debe $5.000')
  })

  it('deja intactas las variables sin valor', () => {
    expect(renderTemplate('Hola {{nombre}} {{apellido}}', { nombre: 'Ana' })).toBe('Hola Ana {{apellido}}')
  })

  it('texto sin variables queda igual', () => {
    expect(renderTemplate('sin variables', {})).toBe('sin variables')
  })
})

describe('extractVariablesFromTemplate', () => {
  it('extrae variables de asunto y cuerpo, deduplicadas y ordenadas', () => {
    expect(extractVariablesFromTemplate('Hola {{nombre}}', 'Tu plan {{plan}} vence. {{nombre}}')).toEqual([
      'nombre',
      'plan',
    ])
  })

  it('soporta nombres con punto (dot notation)', () => {
    expect(extractVariablesFromTemplate(null, '{{club.nombre}} {{persona.email}}')).toEqual([
      'club.nombre',
      'persona.email',
    ])
  })

  it('sin variables -> arreglo vacío', () => {
    expect(extractVariablesFromTemplate('asunto plano', 'cuerpo plano')).toEqual([])
  })

  it('asunto null no rompe', () => {
    expect(extractVariablesFromTemplate(null, 'hola {{x}}')).toEqual(['x'])
  })
})

describe('sincronizarVariablesDisponibles', () => {
  it('une las actuales con las detectadas, sin duplicar y ordenadas', () => {
    expect(sincronizarVariablesDisponibles('{{nombre}}', '{{monto}}', ['extra', 'nombre'])).toEqual([
      'extra',
      'monto',
      'nombre',
    ])
  })

  it('conserva variables explícitas aunque no estén en el texto', () => {
    expect(sincronizarVariablesDisponibles(null, 'sin vars', ['manual'])).toEqual(['manual'])
  })
})
