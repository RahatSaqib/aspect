import { checkIfParamsIsDate } from '../../../components/shared/DateTimeInput/utils/date'

describe('QueryFetch Tests', () => {
  describe('Query Params', () => {
    describe('Format params if object', () => {
      it('it should format date related keys correctly ', () => {
        const paramsMin = [{ minDate: '2019-12-01' }]
        const dataInMin = checkIfParamsIsDate(paramsMin)[0]
        const expectedMin = 'minDate=2019-12-01T00%3A00%3A00.000%2B01%3A00'
        expect(dataInMin).toEqual(expectedMin)

        const paramsMax = [{ maxDate: '2020-02-29' }]
        const dataInMax = checkIfParamsIsDate(paramsMax)[0]
        const expectedMax = 'maxDate=2020-02-29T23%3A59%3A59.999%2B01%3A00'
        expect(dataInMax).toEqual(expectedMax)

        const params = [{ groupBy: 'resultCategory1' }]
        const dataIn = checkIfParamsIsDate(params)[0]
        const expected = 'groupBy=resultCategory1'
        expect(dataIn).toEqual(expected)
      })
    })
  })
})
