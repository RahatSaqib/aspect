import { objectToArray } from './misc'

describe('Object to array', () => {
  it('should convert object to array', function () {
    const object = { state: 'Alabama', country: 'USA' }
    expect(objectToArray(object)).toEqual([{ state: 'Alabama' }, { country: 'USA' }])
  })
})
