import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import startOfYear from 'date-fns/startOfYear'
import subDays from 'date-fns/subDays'
import subMonths from 'date-fns/subMonths'

// Client mirror of the 8 pinned server date tokens (api/src/report/params.js).
// Resolved in browser-local time returning Date objects, consistent with the
// FilterProvider defaults; the server receives them serialized with the user's offset.
const tokenResolvers = {
  today: now => ({ minDate: startOfDay(now), maxDate: endOfDay(now) }),
  yesterday: now => ({ minDate: startOfDay(subDays(now, 1)), maxDate: endOfDay(subDays(now, 1)) }),
  last7Days: now => ({ minDate: startOfDay(subDays(now, 7)), maxDate: endOfDay(now) }),
  last30Days: now => ({ minDate: startOfDay(subDays(now, 30)), maxDate: endOfDay(now) }),
  last90Days: now => ({ minDate: startOfDay(subDays(now, 90)), maxDate: endOfDay(now) }),
  currentMonth: now => ({ minDate: startOfMonth(now), maxDate: endOfMonth(now) }),
  previousMonth: now => ({ minDate: startOfMonth(subMonths(now, 1)), maxDate: endOfMonth(subMonths(now, 1)) }),
  currentYear: now => ({ minDate: startOfYear(now), maxDate: endOfDay(now) }),
}

export const DATE_TOKENS = Object.freeze(Object.keys(tokenResolvers))

// Returns { minDate, maxDate } as Dates, or null for an unknown token (skipped silently).
export const resolveDateToken = (token, now = new Date()) => {
  const resolver = tokenResolvers[token]
  return resolver ? resolver(now) : null
}

// Turns parameter defs into a values object: dateRange default -> { minDate, maxDate }
// Dates; scalar default -> literal; no default (or unknown token) -> key absent.
export const resolveParameterDefaults = (parameters, now = new Date()) =>
  (parameters || []).reduce((values, def) => {
    if (def.default === undefined) return values
    if (def.type === 'dateRange') {
      const range = resolveDateToken(def.default && def.default.period, now)
      return range ? { ...values, ...range } : values
    }
    return { ...values, [def.name]: def.default }
  }, {})
