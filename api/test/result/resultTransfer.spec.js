const supertest = require('supertest')
const chai = require('chai')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { getAccessToken } = require('../utils/authUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

const assertResult = response => {
  assert.equal(response.statusCode, 200)
  assert.typeOf(response.body, 'Object')
  assert.property(response.body, 'data')
  assert.typeOf(response.body.data, 'Object')
  assert.property(response.body.data, 'id')
  assert.property(response.body.data, 'externalId')
  assert.property(response.body.data, 'resultData')
  assert.property(response.body.data, 'reportableSiteId')
}

describe('Result Transfer', () => {
  let authAccessToken
  before(() =>
    runTestWithKnex(async () => {
      authAccessToken = await getAccessToken('admin', 'test07')
    })
  )

  describe('POST', () => {
    it('Should change result.reportableSiteId and add ResultStatusLog', () =>
      runTestWithKnex(async knex => {
        // get list of results accessible for current user
        let response = await server
          .set('Authorization', `Bearer ${authAccessToken}`)
          .get(`/api/result`)
        assert.equal(response.statusCode, 200)
        assert.isAtLeast(response.body.data.length, 1)
        const resultId = response.body.data[0].id

        // get result by resultId
        response = await server
          .set('Authorization', `Bearer ${authAccessToken}`)
          .get(`/api/result/${resultId}`)
        assertResult(response)
        const result = response.body.data
        assert.isNotNull(result)

        const { reportableSiteId } = result
        // get list of accessible sites for current user
        response = await server
          .set('Authorization', `Bearer ${authAccessToken}`)
          .get(`/api/site`)
        assert.equal(response.statusCode, 200)
        assert.isAtLeast(response.body.data.length, 1)
        const sites = response.body.data
        const newSite = sites.find(x => x.id !== reportableSiteId)
        assert.isNotNull(newSite)

        // get last id in ResultStatusLog - to clean log after transfer test
        const [{ logId }] = await knex('ResultStatusLog').max('id as logId')

        // transfer result to new siteId
        response = await server
          .set('Authorization', `Bearer ${authAccessToken}`)
          .post(`/api/result/transfer/${resultId}`)
          .send({ siteId: newSite.id })

        assertResult(response)
        assert.notEqual(response.body.data.reportableSiteId, reportableSiteId)

        // restore initial data
        await knex('ResultStatusLog')
          .where('id', '>', logId)
          .del()
        await knex('Result')
          .where('id', result.id)
          .update({ reportableSiteId })
      }))

    it('should return an error if result does not exist', () =>
      runTestWithKnex(async knex => {
        // get max resultId
        const [{ resultId }] = await knex('Result').max('id as resultId')

        // transfer unknown resultId
        const response = await server
          .set('Authorization', `Bearer ${authAccessToken}`)
          .post(`/api/result/transfer/${resultId + 1}`)
          .send({ siteId: 1 })

        assert.equal(response.statusCode, 404)
      }))
  })
})
