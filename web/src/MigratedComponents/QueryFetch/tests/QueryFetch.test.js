import { checkIfParamIsDate } from '../Helpers'

describe('QueryFetch Tests', () => {
  describe('Query Params', () => {
    describe('Format params if object', () => {
      it('it should format date related keys correctly ', () => {
        const param = { minDate: '2019-12-01' }
        const dataIn = checkIfParamIsDate(param)
        const expected = 'minDate=2019-12-01T01%3A00%3A00.000%2B01%3A00'
        expect(dataIn).toEqual(expected)

        const param2 = { groupBy: 'resultCategory1' }
        const dataIn2 = checkIfParamIsDate(param2)
        const expected2 = 'groupBy=resultCategory1'
        expect(dataIn2).toEqual(expected2)
      })
    })
  })
})
