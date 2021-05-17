const chai = require('chai')
const dateFormat = require('date-fns/format')
const { subMonths, endOfMonth } = require('date-fns')
const shared = require('../utils/sharedToken')

const server = require('../utils/testUtils')

const { assert } = chai

const path = '/api/result/confirmed-treatment-tracking'

describe('Result Treatment', () => {
  describe('Status Tracking - POST', () => {
    before(() => shared.checkToken(server, path))

    it('Should return percentages of OnTreatment and Unaccountable', async () => {
      const now = new Date()
      const endedOn = dateFormat(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
      const siteId = null
      await server
        .post(`${path}`)
        .send({ endedOn, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          assert.property(res.body, 'endedOn')
          assert.property(res.body, 'data')
          assert.property(res.body, 'siteId')

          assert.equal(res.body.data.length, 12) // for 12 months
          const [item] = res.body.data
          assert.property(item, 'monthTested')
          assert.property(item, 'pcOnTreatment')
          assert.property(item, 'total')
          assert.property(item, 'totalResults')
          assert.property(item, 'delivered')
          assert.property(item, 'requiresTreatment')
          assert.property(item, 'onTreatment')
          assert.property(item, 'notPossible')
          assert.property(item, 'notOnTreatment')
          assert.property(item, 'transferred')
        })
    })
  })
})
