import variables from './variables'

describe('Theme', () => {
  it('It is an object that contains at least the primary and accent colors', () => {
    const { theme } = variables
    expect(theme.palette.primary.light).toBeDefined()
    expect(theme.palette.primary.main).toBeDefined()
    expect(theme.palette.primary.dark).toBeDefined()
    expect(theme.palette.primary.contrastText).toBeDefined()
    expect(theme.palette.secondary.light).toBeDefined()
    expect(theme.palette.secondary.main).toBeDefined()
    expect(theme.palette.secondary.dark).toBeDefined()
    expect(theme.palette.secondary.contrastText).toBeDefined()
  })
})
