import { DATE_TOKENS, resolveDateToken, resolveParameterDefaults } from '../dateTokens'

// Jest runs with TZ=Europe/Paris; all Date constructions below are browser-local,
// exactly like the resolver output.
const now = new Date(2026, 6, 15, 14, 30, 45, 123) // Wed 15 Jul 2026 14:30:45.123

const startOf = (y, m, d) => new Date(y, m, d, 0, 0, 0, 0)

const endOf = (y, m, d) => new Date(y, m, d, 23, 59, 59, 999)

describe('dateTokens', () => {
  it('exposes exactly the 8 pinned tokens', () => {
    expect(DATE_TOKENS).toEqual([
      'today',
      'yesterday',
      'last7Days',
      'last30Days',
      'last90Days',
      'currentMonth',
      'previousMonth',
      'currentYear',
    ])
  })

  describe('resolveDateToken', () => {
    const cases = {
      today: { minDate: startOf(2026, 6, 15), maxDate: endOf(2026, 6, 15) },
      yesterday: { minDate: startOf(2026, 6, 14), maxDate: endOf(2026, 6, 14) },
      last7Days: { minDate: startOf(2026, 6, 8), maxDate: endOf(2026, 6, 15) },
      last30Days: { minDate: startOf(2026, 5, 15), maxDate: endOf(2026, 6, 15) },
      last90Days: { minDate: startOf(2026, 3, 16), maxDate: endOf(2026, 6, 15) },
      currentMonth: { minDate: startOf(2026, 6, 1), maxDate: endOf(2026, 6, 31) },
      previousMonth: { minDate: startOf(2026, 5, 1), maxDate: endOf(2026, 5, 30) },
      currentYear: { minDate: startOf(2026, 0, 1), maxDate: endOf(2026, 6, 15) },
    }

    DATE_TOKENS.forEach(token => {
      it(`resolves ${token}`, () => {
        expect(resolveDateToken(token, now)).toEqual(cases[token])
      })
    })

    it('returns null for an unknown token', () => {
      expect(resolveDateToken('lastFortnight', now)).toBeNull()
      expect(resolveDateToken(undefined, now)).toBeNull()
    })
  })

  describe('resolveParameterDefaults', () => {
    it('maps a dateRange default to the minDate/maxDate wire keys', () => {
      const parameters = [{ name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' } }]
      expect(resolveParameterDefaults(parameters, now)).toEqual({
        minDate: startOf(2026, 5, 15),
        maxDate: endOf(2026, 6, 15),
      })
    })

    it('applies scalar defaults verbatim, including falsy 0 and false', () => {
      const parameters = [
        { name: 'groupBy', type: 'enum', options: ['day', 'month'], default: 'month' },
        { name: 'errorThreshold', type: 'number', default: 0 },
        { name: 'includeArchived', type: 'boolean', default: false },
      ]
      expect(resolveParameterDefaults(parameters, now)).toEqual({
        groupBy: 'month',
        errorThreshold: 0,
        includeArchived: false,
      })
    })

    it('leaves keys absent for parameters without a default', () => {
      const parameters = [
        { name: 'dateRange', type: 'dateRange' },
        { name: 'stateId', type: 'state' },
      ]
      expect(resolveParameterDefaults(parameters, now)).toEqual({})
    })

    it('skips an unknown dateRange token without throwing', () => {
      const parameters = [
        { name: 'dateRange', type: 'dateRange', default: { period: 'lastFortnight' } },
        { name: 'groupBy', type: 'enum', default: 'day' },
      ]
      expect(resolveParameterDefaults(parameters, now)).toEqual({ groupBy: 'day' })
    })

    it('tolerates null/undefined parameter lists', () => {
      expect(resolveParameterDefaults(null, now)).toEqual({})
      expect(resolveParameterDefaults(undefined, now)).toEqual({})
    })
  })
})
