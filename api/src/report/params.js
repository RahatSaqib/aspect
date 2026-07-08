const Joi = require('@hapi/joi')
const Boom = require('@hapi/boom')
const { subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear } = require('date-fns')
const { replaceOffset, REGEX_ISODATESTRING } = require('../shared/date')
const logger = require('../shared/logger')

/**
 * Parameter set equivalent to today's global reports filter. Reports whose
 * fixture declares no `parameters` get this set at seed time (zero behavior
 * change: no defaults, no required flags).
 */
const LEGACY_REPORT_PARAMETERS = [
  { name: 'dateRange', type: 'dateRange' },
  { name: 'stateId', type: 'state' },
  { name: 'lgaId', type: 'lga', dependsOn: 'stateId' },
  { name: 'siteName', type: 'site', dependsOn: 'lgaId', permission: 'site:view' },
  { name: 'assayId', type: 'assay', multiple: true },
  { name: 'consumableId', type: 'consumable' },
]

const DATE_TOKEN_RANGES = {
  today: now => ({ min: startOfDay(now), max: endOfDay(now) }),
  yesterday: now => ({ min: startOfDay(subDays(now, 1)), max: endOfDay(subDays(now, 1)) }),
  last7Days: now => ({ min: startOfDay(subDays(now, 7)), max: endOfDay(now) }),
  last30Days: now => ({ min: startOfDay(subDays(now, 30)), max: endOfDay(now) }),
  last90Days: now => ({ min: startOfDay(subDays(now, 90)), max: endOfDay(now) }),
  currentMonth: now => ({ min: startOfMonth(now), max: endOfMonth(now) }),
  previousMonth: now => ({ min: startOfMonth(subMonths(now, 1)), max: endOfMonth(subMonths(now, 1)) }),
  currentYear: now => ({ min: startOfYear(now), max: endOfDay(now) }),
}

const DATE_TOKENS = Object.freeze(Object.keys(DATE_TOKEN_RANGES))

// Everything requestBaseQuery() accepts today: legacy traffic must log zero warnings.
const ENGINE_KEYS = [
  'minDate',
  'maxDate',
  'timeZone',
  'format',
  'countryId',
  'reportName',
  'siteName',
  'stateId',
  'lgaId',
  'assayId',
  'consumableId',
]

const isMissing = value => value === undefined || value === null || value === ''

// A dateRange param never travels under its own name: it maps to minDate/maxDate,
// and is missing only when BOTH are missing (explicit values are never overwritten).
const isDateRangeMissing = incoming => isMissing(incoming.minDate) && isMissing(incoming.maxDate)

function formatRangeInTimeZone(min, max, timeZoneIANA, reportExternalId) {
  try {
    if (!timeZoneIANA) throw new Error('missing time zone')
    return { minDate: replaceOffset(min, timeZoneIANA), maxDate: replaceOffset(max, timeZoneIANA) }
  } catch (err) {
    logger.warn(`report params: unknown timeZone "${timeZoneIANA}" for report ${reportExternalId}, falling back to UTC`)
    return { minDate: replaceOffset(min, 'Etc/UTC'), maxDate: replaceOffset(max, 'Etc/UTC') }
  }
}

/**
 * Resolve a relative date token into concrete `{ minDate, maxDate }` ISO strings
 * with the offset of the given IANA time zone (falls back to UTC on unknown zones,
 * naming the report in the warning when `reportExternalId` is given).
 * Returns null for an unknown token. Never throws.
 */
function resolveDateToken(token, timeZoneIANA, now = new Date(), reportExternalId = undefined) {
  const range = DATE_TOKEN_RANGES[token]
  if (!range) return null
  const { min, max } = range(now)
  return formatRangeInTimeZone(min, max, timeZoneIANA, reportExternalId)
}

/**
 * Fill defaults for MISSING values only. Never mutates `incoming`; returns a new object.
 * For parameter sets without defaults (the legacy set) the output is deep-equal to the
 * input with the identical key set, so async-report hashes are unchanged.
 * @param {Array} parameterDefs - parsed Report.parameters ([] and null-ish tolerated)
 * @param {Object} incoming - the raw query / reportsFilter
 * @param {Object} context - { timeZone, reportExternalId, now = new Date() }
 * @returns {Object} resolved query, same value types as incoming for untouched keys
 */
function resolveParams(parameterDefs, incoming, context = {}) {
  const source = incoming || {}
  const out = { ...source }
  if (!Array.isArray(parameterDefs)) return out
  const { reportExternalId, now = new Date() } = context

  parameterDefs.forEach(def => {
    try {
      if (!def || def.default === undefined || def.default === null) return
      if (def.type === 'dateRange') {
        if (!isDateRangeMissing(out)) return
        const token = def.default.period
        if (!DATE_TOKEN_RANGES[token]) {
          logger.warn(`report params: unknown date token "${token}" for report ${reportExternalId}`)
          return
        }
        const { min, max } = DATE_TOKEN_RANGES[token](now)
        const timeZone = context.timeZone ?? source.timeZone
        const range = formatRangeInTimeZone(min, max, timeZone, reportExternalId)
        out.minDate = range.minDate
        out.maxDate = range.maxDate
      } else if (isMissing(out[def.name])) {
        out[def.name] = def.default
      }
    } catch (err) {
      logger.warn(`report params [${reportExternalId}]: skipped default for "${def && def.name}": ${err.message}`)
    }
  })

  return out
}

function joiSchemaForDef(def) {
  switch (def.type) {
    case 'state':
    case 'lga':
    case 'consumable':
      return Joi.number().integer().positive().allow(null, '')
    case 'assay':
      return Joi.alternatives().try(Joi.array().items(Joi.number()), Joi.number()).allow(null, '')
    case 'site':
    case 'text':
      return Joi.string().allow(null, '')
    case 'enum':
      return Joi.valid(...(def.options || [])).allow(null, '')
    case 'number': {
      let schema = Joi.number()
      if (def.min !== undefined) schema = schema.min(def.min)
      if (def.max !== undefined) schema = schema.max(def.max)
      return schema.allow(null, '')
    }
    case 'boolean':
      return Joi.bool().allow(null, '')
    default:
      return null
  }
}

const dateRangeValueSchema = () => Joi.string().pattern(REGEX_ISODATESTRING).allow(null, '')

/**
 * Validator factory. Returns validate(query, { reportExternalId }) which logs
 * (logger.warn) every violation prefixed with the report externalId and never
 * mutates query. In 'permissive' mode (default) it ALWAYS returns undefined.
 * In 'strict' mode it collects every violation and throws ONE Boom.badRequest
 * whose message never leaks Joi internals or the report externalId; malformed
 * definitions still only warn (a seed typo must never 400 users), and
 * ENGINE_KEYS are never rejected even when the report does not declare them.
 */
function buildParamsValidator(parameterDefs, { mode = 'permissive' } = {}) {
  if (mode !== 'permissive' && mode !== 'strict') throw new Error(`unknown validation mode "${mode}"`)
  const strict = mode === 'strict'
  const defs = Array.isArray(parameterDefs) ? parameterDefs.filter(def => def && def.name && def.type) : []

  return function validate(query, { reportExternalId } = {}) {
    const source = query || {}
    const warn = message => logger.warn(`report params [${reportExternalId}]: ${message}`)
    const declaredKeys = new Set(ENGINE_KEYS)
    // Fragments accumulate in def-declaration order; the undeclared-keys fragment goes last.
    const violations = []

    defs.forEach(def => {
      const wireNames = def.type === 'dateRange' ? ['minDate', 'maxDate'] : [def.name]
      wireNames.forEach(wireName => declaredKeys.add(wireName))

      // Defs are seed-authored, but a typo'd def (e.g. min: '5', options: 5) makes the
      // Joi builders throw — never let a bad definition take the report endpoint down.
      try {
        const schema = def.type === 'dateRange' ? dateRangeValueSchema() : joiSchemaForDef(def)
        if (!schema) {
          warn(`unknown parameter type "${def.type}" declared for "${def.name}"`)
          return
        }

        const missing =
          def.type === 'dateRange'
            ? isDateRangeMissing(source)
            : wireNames.every(wireName => isMissing(source[wireName]))
        if (def.required && missing) {
          warn(`missing required parameter "${def.name}"`)
          violations.push(`missing required parameter "${def.name}"`)
          return
        }

        wireNames.forEach(wireName => {
          if (source[wireName] === undefined) return
          const { error } = schema.validate(source[wireName], { convert: false, abortEarly: false })
          if (error) {
            warn(`invalid value for "${wireName}": ${error.message}`)
            violations.push(`invalid value for "${wireName}"`)
          }
        })
      } catch (err) {
        warn(`malformed definition for "${def.name}": ${err.message}`)
      }
    })

    const undeclaredKeys = Object.keys(source).filter(key => !declaredKeys.has(key))
    if (undeclaredKeys.length) {
      warn(`undeclared parameters: ${undeclaredKeys.join(', ')}`)
      violations.push(`unknown parameters "${undeclaredKeys.join(', ')}"`)
    }

    if (strict && violations.length) throw Boom.badRequest(`Invalid report parameters: ${violations.join('; ')}`)

    return undefined
  }
}

module.exports = {
  LEGACY_REPORT_PARAMETERS,
  DATE_TOKENS,
  resolveDateToken,
  resolveParams,
  buildParamsValidator,
}
