describe('Unit module', () => {
  let getClassNames

  beforeAll(() => {
    ({ getClassNames } = require('./Unit'))
  })

  describe('getClassNames', () => {
    it('should get correct class names', () => {
      const className = getClassNames({
        className: 'abc',
        xs: '1-2',
        sm: '2-5',
        lg: '3-4'
      })

      expect(className).toEqual(['abc', 'pure-u-1-2', 'pure-u-sm-2-5', 'pure-u-lg-3-4'])
    })
  })
})
