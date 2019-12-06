const supertest = require('supertest')
const chai = require('chai')
const dateFormat = require('date-fns/format')
const { subMonths, endOfMonth } = require('date-fns')
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Result Treatment', () => {
  describe('Status Tracking - POST', () => {
    const path = '/api/result/confirmed-treatment-tracking'
    shared.checkToken(server, path)

    it('Should return percentages of OnTreatment and Unaccountable', done => {
      const now = new Date()
      const endedOn = dateFormat(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
      const siteId = null
      server
        .post(`${path}`)
        .send({ endedOn, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          assert.property(res.body, 'endedOn')
          assert.property(res.body, 'data')
          assert.property(res.body, 'siteId')

          assert.equal(res.body.data.length, 6) // for 6 months
          assert.property(res.body.data[0], 'monthTested')
          assert.property(res.body.data[0], 'pcConfirmed')
          assert.property(res.body.data[0], 'cntConfirmed')
          assert.property(res.body.data[0], 'total')

          done()
        })
    })
  })
})
