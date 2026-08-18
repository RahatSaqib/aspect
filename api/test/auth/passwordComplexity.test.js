const { expect } = require('chai')
const { getPasswordComplexity, isPasswordAcceptable } = require('../../src/auth/passwordComplexity')

describe('password complexity', () => {
  it('rejects passwords shorter than 12 characters', () => {
    expect(isPasswordAcceptable('Short1!')).to.equal(false)
  })

  it('accepts a 12-character password with three character classes', () => {
    expect(isPasswordAcceptable('SecurePass12')).to.equal(true)
  })

  it('accepts a 16-character passphrase without numbers or symbols', () => {
    expect(isPasswordAcceptable('correcthorsebattery')).to.equal(true)
  })

  it('rejects a 12-character password with insufficient variety', () => {
    expect(isPasswordAcceptable('qwertyqwerty')).to.equal(false)
  })

  it('rejects whitespace-only passwords', () => {
    expect(isPasswordAcceptable('                ')).to.equal(false)
  })

  it('reports the present and missing character classes', () => {
    expect(getPasswordComplexity('qwerty1234')).to.deep.include({
      acceptable: false,
      classCount: 2,
      length: 10,
    })
    expect(getPasswordComplexity('qwerty1234').missingClasses).to.deep.equal(['uppercase', 'special'])
  })
})
