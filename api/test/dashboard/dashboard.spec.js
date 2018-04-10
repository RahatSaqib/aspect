const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Dashboard routes', () => {
  const path = '/api/dashboard/summary'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of stat dashboard widget objects', done => {
      server
        .get(`${path}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 4)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'icon')
          assert.property(res.body.data[0], 'title')
          assert.property(res.body.data[0], 'titleI18nKey')
          assert.property(res.body.data[0], 'subTitle')
          assert.property(res.body.data[0], 'subTitleI18nKey')
          assert.property(res.body.data[0], 'link')
          assert.property(res.body.data[0], 'count')
          done()
        })
    })

    it('should return a list of target dashboard widget objects', done => {
      server
        .get(`${path}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          done()
        })
    })
  })
})
