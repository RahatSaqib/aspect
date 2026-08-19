import {
  PASSWORD_HINT_KEYS,
  getPasswordComplexity,
  getPasswordHintKey,
  isPasswordAcceptable,
} from './passwordComplexity'

describe('password complexity', () => {
  it('rejects passwords shorter than 12 characters', () => {
    expect(isPasswordAcceptable('Short1!')).toBe(false)
  })

  it('accepts a 12-character password with three character classes', () => {
    expect(isPasswordAcceptable('SecurePass12')).toBe(true)
  })

  it('accepts a 16-character passphrase without numbers or symbols', () => {
    expect(isPasswordAcceptable('correcthorsebattery')).toBe(true)
  })

  it('rejects a 12-character password with insufficient variety', () => {
    expect(isPasswordAcceptable('qwertyqwerty')).toBe(false)
  })

  it('reports the present and missing character classes', () => {
    expect(getPasswordComplexity('qwerty1234')).toMatchObject({
      acceptable: false,
      classCount: 2,
      length: 10,
      missingClasses: ['uppercase', 'special'],
    })
  })

  it('suggests more length and variety for qwerty-style passwords', () => {
    expect(getPasswordHintKey('qwerty1234')).toBe(PASSWORD_HINT_KEYS.MIN_LENGTH_AND_VARIETY)
  })

  it('mentions the adaptive policy before the user starts typing', () => {
    expect(getPasswordHintKey('')).toBe(PASSWORD_HINT_KEYS.INITIAL)
  })

  it('suggests numbers and symbols for a 12-character letters-only password', () => {
    expect(getPasswordHintKey('qwertyqwerty')).toBe(PASSWORD_HINT_KEYS.ADD_NUMBERS_SYMBOLS_OR_LONGER)
  })

  it('returns no hint for an acceptable password', () => {
    expect(getPasswordHintKey('correcthorsebattery')).toBeNull()
  })
})
