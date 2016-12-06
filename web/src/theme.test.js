import theme from './theme'

describe('Theme', () => {
  it('It is an object that contains at least the primary and accent colors', () => {
    expect(theme.palette.primary1Color).toBeDefined()
    expect(theme.palette.primary2Color).toBeDefined()
    expect(theme.palette.primary3Color).toBeDefined()
    expect(theme.palette.accent1Color).toBeDefined()
    expect(theme.palette.accent2Color).toBeDefined()
    expect(theme.palette.accent3Color).toBeDefined()
  })
})
