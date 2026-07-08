const { assert } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const { jsonToArraySorted } = require('../../src/shared/sort')
const { getHash } = require('../../src/shared/encryption')

// Fixed instant: 2026-07-06 10:20:30 UTC. Tests run with TZ=UTC (see package.json).
const NOW = new Date('2026-07-06T10:20:30Z')
const DHAKA = 'Asia/Dhaka'

describe('report params', () => {
  let warnStub
  let params

  beforeEach(() => {
    warnStub = sinon.stub()
    params = proxyquire('../../src/report/params', {
      '../shared/logger': { warn: warnStub },
    })
  })

  describe('DATE_TOKENS', () => {
    it('exposes exactly the eight pinned tokens, frozen', () => {
      assert.deepEqual(params.DATE_TOKENS, [
        'today',
        'yesterday',
        'last7Days',
        'last30Days',
        'last90Days',
        'currentMonth',
        'previousMonth',
        'currentYear',
      ])
      assert.isFrozen(params.DATE_TOKENS)
    })
  })

  describe('resolveDateToken', () => {
    const expected = {
      today: { minDate: '2026-07-06T00:00:00+06:00', maxDate: '2026-07-06T23:59:59+06:00' },
      yesterday: { minDate: '2026-07-05T00:00:00+06:00', maxDate: '2026-07-05T23:59:59+06:00' },
      last7Days: { minDate: '2026-06-29T00:00:00+06:00', maxDate: '2026-07-06T23:59:59+06:00' },
      last30Days: { minDate: '2026-06-06T00:00:00+06:00', maxDate: '2026-07-06T23:59:59+06:00' },
      last90Days: { minDate: '2026-04-07T00:00:00+06:00', maxDate: '2026-07-06T23:59:59+06:00' },
      currentMonth: { minDate: '2026-07-01T00:00:00+06:00', maxDate: '2026-07-31T23:59:59+06:00' },
      previousMonth: { minDate: '2026-06-01T00:00:00+06:00', maxDate: '2026-06-30T23:59:59+06:00' },
      currentYear: { minDate: '2026-01-01T00:00:00+06:00', maxDate: '2026-07-06T23:59:59+06:00' },
    }

    Object.keys(expected).forEach(token => {
      it(`resolves "${token}" in Asia/Dhaka`, () => {
        assert.deepEqual(params.resolveDateToken(token, DHAKA, NOW), expected[token])
        sinon.assert.notCalled(warnStub)
      })
    })

    it('returns null for an unknown token without throwing', () => {
      assert.isNull(params.resolveDateToken('lastFortnight', DHAKA, NOW))
    })

    it('falls back to UTC with a warning for an unknown time zone', () => {
      assert.deepEqual(params.resolveDateToken('today', 'Not/AZone', NOW), {
        minDate: '2026-07-06T00:00:00Z',
        maxDate: '2026-07-06T23:59:59Z',
      })
      sinon.assert.calledOnce(warnStub)
      assert.include(warnStub.firstCall.args[0], 'unknown timeZone "Not/AZone"')
    })

    it('falls back to UTC with a warning for a missing time zone', () => {
      assert.deepEqual(params.resolveDateToken('today', undefined, NOW), {
        minDate: '2026-07-06T00:00:00Z',
        maxDate: '2026-07-06T23:59:59Z',
      })
      sinon.assert.calledOnce(warnStub)
    })

    it('names the report in the UTC-fallback warning when reportExternalId is passed', () => {
      params.resolveDateToken('today', 'Not/AZone', NOW, 'my_report')
      sinon.assert.calledOnce(warnStub)
      assert.include(warnStub.firstCall.args[0], 'for report my_report')
    })
  })

  describe('resolveParams', () => {
    const context = { timeZone: DHAKA, reportExternalId: 'some_report', now: NOW }

    it('tolerates null-ish and empty parameter defs', () => {
      assert.deepEqual(params.resolveParams(null, { stateId: 1 }, context), { stateId: 1 })
      assert.deepEqual(params.resolveParams([], { stateId: 1 }, context), { stateId: 1 })
      assert.deepEqual(params.resolveParams(undefined, undefined, context), {})
    })

    it('fills defaults for missing values only', () => {
      const defs = [
        { name: 'groupBy', type: 'enum', options: ['day', 'week', 'month'], default: 'month' },
        { name: 'errorThreshold', type: 'number', default: 5, min: 0, max: 100 },
      ]
      assert.deepEqual(params.resolveParams(defs, {}, context), { groupBy: 'month', errorThreshold: 5 })
      assert.deepEqual(params.resolveParams(defs, { groupBy: 'day' }, context), { groupBy: 'day', errorThreshold: 5 })
    })

    it('treats null and empty string as missing', () => {
      const defs = [{ name: 'groupBy', type: 'enum', options: ['day', 'month'], default: 'month' }]
      assert.deepEqual(params.resolveParams(defs, { groupBy: null }, context), { groupBy: 'month' })
      assert.deepEqual(params.resolveParams(defs, { groupBy: '' }, context), { groupBy: 'month' })
    })

    it('never overwrites explicit values, including 0, false and arrays', () => {
      const defs = [
        { name: 'errorThreshold', type: 'number', default: 5 },
        { name: 'includeArchived', type: 'boolean', default: true },
        { name: 'assayId', type: 'assay', multiple: true, default: 7 },
      ]
      const incoming = { errorThreshold: 0, includeArchived: false, assayId: [] }
      assert.deepEqual(params.resolveParams(defs, incoming, context), incoming)
    })

    it('leaves params without a default absent (all-time semantics)', () => {
      const resolved = params.resolveParams(params.LEGACY_REPORT_PARAMETERS, {}, context)
      assert.deepEqual(resolved, {})
      sinon.assert.notCalled(warnStub)
    })

    it('does not mutate the incoming object', () => {
      const defs = [{ name: 'groupBy', type: 'enum', options: ['month'], default: 'month' }]
      const incoming = { stateId: 3 }
      params.resolveParams(defs, incoming, context)
      assert.deepEqual(incoming, { stateId: 3 })
    })

    it('resolves a dateRange default into minDate/maxDate wire keys', () => {
      const defs = [{ name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' } }]
      assert.deepEqual(params.resolveParams(defs, {}, context), {
        minDate: '2026-06-06T00:00:00+06:00',
        maxDate: '2026-07-06T23:59:59+06:00',
      })
    })

    it('does not apply the dateRange default when either bound is present', () => {
      const defs = [{ name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' } }]
      const onlyMax = { maxDate: '2026-07-06T23:59:59+06:00' }
      assert.deepEqual(params.resolveParams(defs, onlyMax, context), onlyMax)
      const onlyMin = { minDate: '2026-06-06T00:00:00+06:00' }
      assert.deepEqual(params.resolveParams(defs, onlyMin, context), onlyMin)
    })

    it('uses incoming.timeZone when context.timeZone is absent', () => {
      const defs = [{ name: 'dateRange', type: 'dateRange', default: { period: 'today' } }]
      const resolved = params.resolveParams(defs, { timeZone: DHAKA }, { reportExternalId: 'some_report', now: NOW })
      assert.deepEqual(resolved, {
        timeZone: DHAKA,
        minDate: '2026-07-06T00:00:00+06:00',
        maxDate: '2026-07-06T23:59:59+06:00',
      })
    })

    it('warns and applies no default for an unknown date token', () => {
      const defs = [{ name: 'dateRange', type: 'dateRange', default: { period: 'lastFortnight' } }]
      assert.deepEqual(params.resolveParams(defs, {}, context), {})
      sinon.assert.calledOnce(warnStub)
      assert.include(warnStub.firstCall.args[0], 'unknown date token "lastFortnight"')
      assert.include(warnStub.firstCall.args[0], 'some_report')
    })

    it('warns and falls back to UTC for an unknown time zone', () => {
      const defs = [{ name: 'dateRange', type: 'dateRange', default: { period: 'today' } }]
      const resolved = params.resolveParams(defs, {}, { ...context, timeZone: 'Not/AZone' })
      assert.deepEqual(resolved, { minDate: '2026-07-06T00:00:00Z', maxDate: '2026-07-06T23:59:59Z' })
      sinon.assert.calledOnce(warnStub)
      assert.include(warnStub.firstCall.args[0], 'unknown timeZone "Not/AZone"')
    })

    it('skips malformed defs with a warning instead of throwing', () => {
      const defs = [null, { name: 'dateRange', type: 'dateRange', default: 'not-an-object' }]
      assert.deepEqual(params.resolveParams(defs, {}, context), {})
      sinon.assert.calledOnce(warnStub)
    })

    it('is idempotent', () => {
      const defs = [
        { name: 'dateRange', type: 'dateRange', default: { period: 'last30Days' } },
        { name: 'groupBy', type: 'enum', options: ['month'], default: 'month' },
      ]
      const once = params.resolveParams(defs, {}, context)
      const twice = params.resolveParams(defs, once, { ...context, now: new Date('2027-01-01T00:00:00Z') })
      assert.deepEqual(twice, once)
    })

    it('keeps async-report hashes byte-identical for the legacy set', () => {
      const representative = {
        minDate: '2026-06-06T00:00:00+06:00',
        maxDate: '2026-07-06T23:59:59+06:00',
        stateId: 3,
        lgaId: '',
        assayId: [1, 2],
        consumableId: null,
        siteName: 'Central Lab',
        timeZone: DHAKA,
      }
      const queries = [representative, {}]
      queries.forEach(query => {
        const resolved = params.resolveParams(params.LEGACY_REPORT_PARAMETERS, query, context)
        assert.deepEqual(resolved, query)
        assert.sameMembers(Object.keys(resolved), Object.keys(query))
        assert.equal(
          getHash(JSON.stringify(jsonToArraySorted(resolved))),
          getHash(JSON.stringify(jsonToArraySorted(query)))
        )
      })
      sinon.assert.notCalled(warnStub)
    })
  })

  describe('buildParamsValidator', () => {
    const validateOptions = { reportExternalId: 'some_report' }

    it('throws for an unknown validation mode', () => {
      assert.throws(() => params.buildParamsValidator([], { mode: 'lenient' }), 'unknown validation mode "lenient"')
    })

    it('logs zero warnings for legacy traffic', () => {
      const validate = params.buildParamsValidator(params.LEGACY_REPORT_PARAMETERS)
      const legacyQuery = {
        minDate: '2026-06-06T00:00:00+06:00',
        maxDate: '2026-07-06T23:59:59+06:00',
        stateId: 3,
        lgaId: '',
        siteName: 'Central Lab',
        assayId: [1, 2],
        consumableId: null,
        timeZone: DHAKA,
        format: 'xlsx',
        countryId: 1,
        reportName: '',
      }
      assert.isUndefined(validate(legacyQuery, validateOptions))
      sinon.assert.notCalled(warnStub)
    })

    it('tolerates null-ish defs and empty queries', () => {
      assert.isUndefined(params.buildParamsValidator(null)(undefined, validateOptions))
      assert.isUndefined(params.buildParamsValidator([])({}, validateOptions))
      sinon.assert.notCalled(warnStub)
    })

    it('warns once for undeclared keys, never rejects', () => {
      const validate = params.buildParamsValidator(params.LEGACY_REPORT_PARAMETERS)
      assert.isUndefined(validate({ stateId: 3, adHocThing: 1, otherThing: 'x' }, validateOptions))
      sinon.assert.calledOnce(warnStub)
      assert.match(
        warnStub.firstCall.args[0],
        /^report params \[some_report\]: undeclared parameters: adHocThing, otherThing$/
      )
    })

    it('warns for values violating the declared type, never throws or mutates', () => {
      const validate = params.buildParamsValidator(params.LEGACY_REPORT_PARAMETERS)
      const query = { stateId: 'abc', minDate: 'not-a-date' }
      assert.isUndefined(validate(query, validateOptions))
      sinon.assert.calledTwice(warnStub)
      warnStub.getCalls().forEach(call => assert.match(call.args[0], /^report params \[some_report\]: /))
      assert.deepEqual(query, { stateId: 'abc', minDate: 'not-a-date' })
    })

    it('warns for a missing required parameter in permissive mode', () => {
      const validate = params.buildParamsValidator([
        { name: 'dateRange', type: 'dateRange', required: true, default: { period: 'last30Days' } },
      ])
      assert.isUndefined(validate({}, validateOptions))
      sinon.assert.calledOnce(warnStub)
      assert.include(warnStub.firstCall.args[0], 'missing required parameter "dateRange"')
    })

    it('does not flag a required dateRange when either bound is present', () => {
      const validate = params.buildParamsValidator([{ name: 'dateRange', type: 'dateRange', required: true }])
      assert.isUndefined(validate({ maxDate: '2026-07-06T23:59:59+06:00' }, validateOptions))
      sinon.assert.notCalled(warnStub)
    })

    it('enforces enum options and number bounds as warnings', () => {
      const validate = params.buildParamsValidator([
        { name: 'groupBy', type: 'enum', options: ['day', 'week', 'month'] },
        { name: 'errorThreshold', type: 'number', min: 0, max: 100 },
      ])
      assert.isUndefined(validate({ groupBy: 'year', errorThreshold: 500 }, validateOptions))
      sinon.assert.calledTwice(warnStub)
      assert.include(warnStub.firstCall.args[0], '"groupBy"')
      assert.include(warnStub.secondCall.args[0], '"errorThreshold"')
    })

    it('warns instead of throwing for malformed defs that break the Joi builders', () => {
      const validate = params.buildParamsValidator([
        { name: 'errorThreshold', type: 'number', min: '5' }, // Joi.number().min('5') throws
        { name: 'groupBy', type: 'enum', options: 5 }, // spread of non-iterable throws
      ])
      assert.isUndefined(validate({ errorThreshold: 10, groupBy: 'day' }, validateOptions))
      sinon.assert.calledTwice(warnStub)
      assert.include(warnStub.firstCall.args[0], 'malformed definition for "errorThreshold"')
      assert.include(warnStub.secondCall.args[0], 'malformed definition for "groupBy"')
    })

    it('still flags malformed-def keys as declared, not undeclared', () => {
      const validate = params.buildParamsValidator([{ name: 'errorThreshold', type: 'number', min: '5' }])
      assert.isUndefined(validate({ errorThreshold: 10 }, validateOptions))
      sinon.assert.calledOnce(warnStub)
      assert.include(warnStub.firstCall.args[0], 'malformed definition')
    })

    it('warns for an unknown declared parameter type instead of throwing', () => {
      const validate = params.buildParamsValidator([{ name: 'weird', type: 'hologram' }])
      assert.isUndefined(validate({}, validateOptions))
      sinon.assert.calledOnce(warnStub)
      assert.include(warnStub.firstCall.args[0], 'unknown parameter type "hologram"')
    })
  })

  describe('buildParamsValidator — strict mode', () => {
    const validateOptions = { reportExternalId: 'some_report' }
    const strict = defs => params.buildParamsValidator(defs, { mode: 'strict' })

    const catchBoom = fn => {
      try {
        fn()
      } catch (err) {
        return err
      }
      return assert.fail('expected a Boom.badRequest to be thrown')
    }

    it('rejects undeclared keys with one 400 listing all of them', () => {
      const err = catchBoom(() =>
        strict(params.LEGACY_REPORT_PARAMETERS)({ stateId: 3, adHocThing: 1, otherThing: 'x' }, validateOptions)
      )
      assert.isTrue(err.isBoom)
      assert.equal(err.output.statusCode, 400)
      assert.equal(err.message, 'Invalid report parameters: unknown parameters "adHocThing, otherThing"')
    })

    it('rejects a missing required scalar parameter', () => {
      const defs = [{ name: 'groupBy', type: 'enum', options: ['day', 'month'], required: true }]
      const err = catchBoom(() => strict(defs)({}, validateOptions))
      assert.equal(err.message, 'Invalid report parameters: missing required parameter "groupBy"')
      const emptyErr = catchBoom(() => strict(defs)({ groupBy: '' }, validateOptions))
      assert.equal(emptyErr.message, 'Invalid report parameters: missing required parameter "groupBy"')
    })

    it('rejects a required dateRange only when BOTH bounds are missing', () => {
      const defs = [{ name: 'dateRange', type: 'dateRange', required: true }]
      const err = catchBoom(() => strict(defs)({}, validateOptions))
      assert.equal(err.message, 'Invalid report parameters: missing required parameter "dateRange"')
      const nullishErr = catchBoom(() => strict(defs)({ minDate: null, maxDate: '' }, validateOptions))
      assert.equal(nullishErr.message, 'Invalid report parameters: missing required parameter "dateRange"')
    })

    it('accepts a required dateRange when one bound is present', () => {
      const defs = [{ name: 'dateRange', type: 'dateRange', required: true }]
      assert.isUndefined(strict(defs)({ maxDate: '2026-07-06T23:59:59+06:00' }, validateOptions))
      assert.isUndefined(strict(defs)({ minDate: '2026-06-06T00:00:00+06:00' }, validateOptions))
      sinon.assert.notCalled(warnStub)
    })

    it('rejects type violations naming the wire key without Joi text or externalId', () => {
      const err = catchBoom(() => strict(params.LEGACY_REPORT_PARAMETERS)({ stateId: 'abc' }, validateOptions))
      assert.equal(err.message, 'Invalid report parameters: invalid value for "stateId"')
      assert.notInclude(err.message, 'must be')
      assert.notInclude(err.message, 'some_report')
    })

    it('rejects enum option violations', () => {
      const defs = [{ name: 'groupBy', type: 'enum', options: ['day', 'week', 'month'] }]
      const err = catchBoom(() => strict(defs)({ groupBy: 'year' }, validateOptions))
      assert.equal(err.message, 'Invalid report parameters: invalid value for "groupBy"')
    })

    it('rejects number bounds violations', () => {
      const defs = [{ name: 'errorThreshold', type: 'number', min: 0, max: 100 }]
      const err = catchBoom(() => strict(defs)({ errorThreshold: 500 }, validateOptions))
      assert.equal(err.message, 'Invalid report parameters: invalid value for "errorThreshold"')
    })

    it('never rejects ENGINE_KEYS the report does not declare', () => {
      const defs = [{ name: 'groupBy', type: 'enum', options: ['day', 'month'] }]
      const engineOnlyQuery = {
        minDate: '2026-06-06T00:00:00+06:00',
        maxDate: '2026-07-06T23:59:59+06:00',
        timeZone: DHAKA,
        format: 'xlsx',
        countryId: 1,
        reportName: '',
        siteName: 'Central Lab',
        stateId: 3,
        lgaId: 7,
        assayId: [1, 2],
        consumableId: 4,
      }
      assert.isUndefined(strict(defs)(engineOnlyQuery, validateOptions))
      sinon.assert.notCalled(warnStub)
    })

    it('still type-checks ENGINE_KEYS when the report declares the matching param', () => {
      const err = catchBoom(() => strict(params.LEGACY_REPORT_PARAMETERS)({ minDate: 'not-a-date' }, validateOptions))
      assert.equal(err.message, 'Invalid report parameters: invalid value for "minDate"')
    })

    it('warns and skips malformed defs instead of rejecting users', () => {
      const defs = [
        { name: 'errorThreshold', type: 'number', min: '5' }, // Joi.number().min('5') throws
        { name: 'weird', type: 'hologram' },
      ]
      assert.isUndefined(strict(defs)({ errorThreshold: 10 }, validateOptions))
      sinon.assert.calledTwice(warnStub)
      assert.include(warnStub.firstCall.args[0], 'malformed definition for "errorThreshold"')
      assert.include(warnStub.secondCall.args[0], 'unknown parameter type "hologram"')
    })

    it('collects every violation into ONE Boom in def-declaration order, unknown keys last', () => {
      const defs = [
        { name: 'dateRange', type: 'dateRange', required: true },
        { name: 'groupBy', type: 'enum', options: ['day', 'week', 'month'] },
        { name: 'errorThreshold', type: 'number', min: 0, max: 100 },
      ]
      const err = catchBoom(() => strict(defs)({ groupBy: 'year', errorThreshold: 500, foo: 1, bar: 2 }, validateOptions))
      assert.equal(
        err.message,
        'Invalid report parameters: missing required parameter "dateRange"; ' +
          'invalid value for "groupBy"; invalid value for "errorThreshold"; unknown parameters "foo, bar"'
      )
    })

    it('logs full Joi detail with the pinned prefix while the Boom stays clean', () => {
      const defs = [{ name: 'errorThreshold', type: 'number', min: 0, max: 100 }]
      catchBoom(() => strict(defs)({ errorThreshold: 500 }, validateOptions))
      sinon.assert.calledOnce(warnStub)
      assert.match(warnStub.firstCall.args[0], /^report params \[some_report\]: invalid value for "errorThreshold": /)
      assert.include(warnStub.firstCall.args[0], '100')
    })

    it('never mutates the query when rejecting', () => {
      const query = { stateId: 'abc', adHocThing: 1 }
      catchBoom(() => strict(params.LEGACY_REPORT_PARAMETERS)(query, validateOptions))
      assert.deepEqual(query, { stateId: 'abc', adHocThing: 1 })
    })

    it('produces zero warnings and zero rejections for legacy traffic', () => {
      const legacyQuery = {
        minDate: '2026-06-06T00:00:00+06:00',
        maxDate: '2026-07-06T23:59:59+06:00',
        stateId: 3,
        lgaId: '',
        siteName: 'Central Lab',
        assayId: [1, 2],
        consumableId: null,
        timeZone: DHAKA,
        format: 'xlsx',
        countryId: 1,
        reportName: '',
      }
      assert.isUndefined(strict(params.LEGACY_REPORT_PARAMETERS)(legacyQuery, validateOptions))
      assert.isUndefined(strict(params.LEGACY_REPORT_PARAMETERS)({}, validateOptions))
      sinon.assert.notCalled(warnStub)
    })
  })

  describe('ISO date-string guards (notification wire shape)', () => {
    it('REGEX_ISODATESTRING accepts new Date().toISOString() output', () => {
      const { REGEX_ISODATESTRING } = require('../../src/shared/date')
      assert.isTrue(REGEX_ISODATESTRING.test(new Date().toISOString()))
    })

    it('strict dateRange validation accepts toISOString()-shaped bounds', () => {
      const validate = params.buildParamsValidator([{ name: 'dateRange', type: 'dateRange' }], { mode: 'strict' })
      assert.isUndefined(
        validate(
          { minDate: '2026-01-01T00:00:00.000Z', maxDate: '2026-01-31T23:59:59.999Z' },
          { reportExternalId: 'some_report' }
        )
      )
      sinon.assert.notCalled(warnStub)
    })
  })

  describe('resolve-then-validate ordering', () => {
    it('a required def with a default passes strict validation when the key is omitted', () => {
      const context = { timeZone: DHAKA, reportExternalId: 'some_report', now: NOW }
      const defs = [
        { name: 'dateRange', type: 'dateRange', required: true, default: { period: 'last30Days' } },
        { name: 'groupBy', type: 'enum', options: ['day', 'month'], required: true, default: 'month' },
      ]
      const resolved = params.resolveParams(defs, {}, context)
      assert.isUndefined(params.buildParamsValidator(defs, { mode: 'strict' })(resolved, { reportExternalId: 'some_report' }))
      sinon.assert.notCalled(warnStub)
    })
  })
})
