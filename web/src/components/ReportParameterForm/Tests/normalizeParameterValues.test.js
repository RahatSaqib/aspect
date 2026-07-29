import { normalizeParameterValues } from '../normalizeParameterValues'

describe('normalizeParameterValues', () => {
  const multiAssay = [{ name: 'assayId', type: 'assay', multiple: true }]

  it('converts multi-select assay objects to numeric ids', () => {
    expect(
      normalizeParameterValues(multiAssay, {
        assayId: [
          { id: 2, i18nKey: 'mtb' },
          { id: 5, i18nKey: 'rif' },
        ],
      })
    ).toEqual({ assayId: [2, 5] })
  })

  it('drops empty multi-select assay values', () => {
    expect(normalizeParameterValues(multiAssay, { assayId: [] })).toEqual({})
  })

  it('coerces single assay strings to numbers', () => {
    expect(normalizeParameterValues([{ name: 'assayId', type: 'assay' }], { assayId: '3' })).toEqual({ assayId: 3 })
  })

  it('drops null and empty geography params so they are not serialized as "null"', () => {
    expect(
      normalizeParameterValues(
        [
          { name: 'stateId', type: 'state' },
          { name: 'lgaId', type: 'lga' },
        ],
        { stateId: null, lgaId: '', minDate: '2020-01-01', showDecommissionedDevices: false }
      )
    ).toEqual({ minDate: '2020-01-01', showDecommissionedDevices: false })
  })

  it('keeps numeric zero', () => {
    expect(normalizeParameterValues([{ name: 'errorThreshold', type: 'number' }], { errorThreshold: 0 })).toEqual({
      errorThreshold: 0,
    })
  })
})
