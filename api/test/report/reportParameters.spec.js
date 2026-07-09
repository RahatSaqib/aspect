const chai = require('chai')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const server = require('../utils/testUtils')

const { assert } = chai

describe('Report parameters API', () => {
  const path = '/api/reports'

  before(() => {
    shared.checkToken(server, path)
  })

  describe('GET /reports', () => {
    it('returns parameters on every report', () =>
      runTestWithKnex(async () => {
        await shared.ensureToken(server)
        const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.status, 200)
        assert.isAtLeast(res.body.data.length, 1)

        res.body.data.forEach(report => {
          assert.isArray(report.parameters)
          assert.isAtLeast(report.parameters.length, 1)
          report.parameters.forEach(parameter => {
            assert.isString(parameter.name)
            assert.isString(parameter.type)
          })
        })

        const dated = res.body.data.find(r => r.externalId === 'device_and_site_summary_report')
        assert.isDefined(dated)
        const dateRange = dated.parameters.find(p => p.type === 'dateRange')
        assert.isDefined(dateRange)
        assert.isTrue(dateRange.required)
        assert.deepEqual(dateRange.default, { period: 'last30Days' })
      }))
  })

  describe('GET /reports/{externalId} parameter validation', () => {
    const externalId = 'device_and_site_summary_report'

    it('returns 400 for an undeclared parameter in strict mode', async () => {
      await shared.ensureToken(server)
      const res = await server
        .get(`${path}/${externalId}`)
        .query({
          format: 'xlsx',
          timeZone: 'Etc/UTC',
          minDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          maxDate: new Date().toISOString(),
          notARealParam: 'nope',
        })
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 400)
    })
  })
})
