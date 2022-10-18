const _ = require('lodash')
const chai = require('chai')
const { subDays } = require('date-fns')

const shared = require('../utils/sharedToken')
const dashboardWidget = require('../../seeds/test/fixtures/dashboardWidget')
const dashboardWidgetMyanmar = require('../../seeds/test/fixtures/myanmarDashboardWidget')

const server = require('../utils/testUtils')

const { assert } = chai

function getAllWidgets() {
  const widgets = [...dashboardWidget.stat, ...dashboardWidgetMyanmar.stat, ...dashboardWidgetMyanmar.target]
  return widgets
}

function assertWidgetItemProps(item) {
  assert.property(item, 'id')
  assert.property(item, 'icon')
  assert.property(item, 'title')
  assert.property(item, 'titleI18nKey')
  assert.property(item, 'subTitle')
  assert.property(item, 'subTitleI18nKey')
  assert.property(item, 'link')
  assert.property(item, 'count')
  assert.property(item, 'externalId')
  assert.property(item, 'description')
  assert.property(item, 'descriptionI18nKey')
}

describe('Dashboard routes', () => {
  describe('GET /api/dashboard/summary', () => {
    const path = '/api/dashboard/summary'
    before(() => {
      shared.checkToken(server, path)
    })

    it('should return a list of stat dashboard widget objects for Operational Data dashboard', async () => {
      const res = await server.get(`${path}?dashboard=operational`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAtLeast(res.body.data.length, 1)
      assertWidgetItemProps(res.body.data[0])

      // check widget on OperationalData dashboard - fixture must have at least one widget for this dashboard
      const externalIds = getAllWidgets()
        .filter(({ dashboards = {} }) => _.isPlainObject(dashboards.operational))
        .map(({ externalId }) => externalId)
      assert.equal(externalIds.includes(res.body.data[0].externalId), true)
    })

    describe('/dashboard/operational-data', () => {
      const operationalDashboardPath = '/api/dashboard/operational-data'

      describe('activity-over-time', () => {
        const now = new Date()
        const path = `${operationalDashboardPath}/activity-over-time?minDate=${subDays(
          now,
          30
        ).toISOString()}&maxDate=${now.toISOString()}`
        it('should return a list of stat dashboard widget objects', async () => {
          const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 30)
          assert.property(res.body.data[0], 'date')
          assert.property(res.body.data[0], 'devicesActive')
          assert.property(res.body.data[0], 'devicesInactive')
          assert.property(res.body.data[0], 'devicesTotal')
          assert.property(res.body.data[0], 'isWeekendOrHoliday')
        })
      })
    })
  })
})
