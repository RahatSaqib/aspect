const chai = require('chai')
const supertest = require('supertest')
const _ = require('lodash')
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe.only('Forms routes', () => {
  const path = '/api/get-forms'
  shared.checkToken(server, path)
  describe('GET', () => {
    it('should return a form by disease', async () => {
      const res = await server
        .get(`${path}?diseaseId=1`)
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      const { data } = res.body
      assert.isTrue(!_.isNil(data))

      assert.isAtLeast(_.filter(data, elem => elem.hasResults).length, 1)
      assert.isTrue(!_.isNil(data.length))
    })
  })
})
