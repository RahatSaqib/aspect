const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Dashboard routes', () => {
  const path = '/api/dashboard/summary'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return an list of dashboard widget object', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'array')
          assert.isAtLeast(res.body.length, 4)
          assert.property(res.body[0], 'id')
          assert.property(res.body[0], 'icon')
          assert.property(res.body[0], 'title')
          assert.property(res.body[0], 'titleI18nKey')
          assert.property(res.body[0], 'subTitle')
          assert.property(res.body[0], 'subTitleI18nKey')
          assert.property(res.body[0], 'link')
          assert.property(res.body[0], 'count')
          done()
        })
    })
  })
})
