const { expect } = require('chai')
const { getMonthsDatefields } = require('../../../src/device/serviceReports/logic')

describe('getMonthsDatefields', () => {
  it('should return correct months for a basic date range with Date objects', () => {
    const minDate = new Date('2024-01-01')
    const maxDate = new Date('2024-03-31')
    const result = getMonthsDatefields(minDate, maxDate, 'en-US')
    expect(result).to.deep.equal([
      { key: '2024-01', header: '2024-Jan' },
      { key: '2024-02', header: '2024-Feb' },
      { key: '2024-03', header: '2024-Mar' },
    ])
  })

  it('should work with ISO date strings', () => {
    const minDate = '2024-01-01'
    const maxDate = '2024-02-29'
    const result = getMonthsDatefields(minDate, maxDate, 'fr-FR')
    expect(result).to.deep.include.members([
      { key: '2024-01', header: '2024-janv.' },
      { key: '2024-02', header: '2024-févr.' },
    ])
  })

  it('should work with timezone-aware date strings', () => {
    const minDate = '2024-01-01T00:00:00Z'
    const maxDate = '2024-01-31T23:59:59Z'
    const result = getMonthsDatefields(minDate, maxDate, 'es-ES')
    expect(result).to.deep.include({ key: '2024-01', header: '2024-ene' })
    expect(result.length).to.equal(1)
  })

  it('should return a single month if minDate and maxDate are in the same month', () => {
    const minDate = '2024-05-01'
    const maxDate = '2024-05-31'
    const result = getMonthsDatefields(minDate, maxDate, 'en-US')
    expect(result).to.deep.equal([{ key: '2024-05', header: '2024-May' }])
  })

  it('should handle minDate after maxDate by returning an empty array', () => {
    const minDate = '2024-07-01'
    const maxDate = '2024-06-30'
    const result = getMonthsDatefields(minDate, maxDate, 'en-US')
    expect(result).to.deep.equal([])
  })
})
