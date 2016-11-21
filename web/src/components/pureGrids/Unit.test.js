import { assert } from 'chai'
import proxyquire from 'proxyquire'

describe('Unit module', () => {
  let getClassNames

  before(() => {
    ({ getClassNames } = proxyquire('./Unit', {
      './pure-grids-responsive-min.css': {
        __esModule: true,
        default: new Proxy({}, { get(t, name) { return name } })
      }
    }))
  })

  describe('getClassNames', () => {
    it('should get correct class names', () => {
      const className = getClassNames({
        className: 'abc',
        xs: '1-2',
        sm: '2-5',
        lg: '3-4'
      })

      assert.deepEqual(className, ['abc', 'pure-u-1-2', 'pure-u-sm-2-5', 'pure-u-lg-3-4'])
    })
  })
})
