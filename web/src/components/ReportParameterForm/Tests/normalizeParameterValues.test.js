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
})
