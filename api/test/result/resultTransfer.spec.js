const chai = require('chai')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')

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
  assert.property(response.body.data, 'transferredOn')
  assert.property(response.body.data, 'transferredBy')
}

describe('Result Transfer', () => {
  const path = '/api/result'

  describe('POST', () => {
    let result
    let newSite1
    let newSite2
    let reportableSiteId
    let resultStatusLogId
    const timeStampNew = new Date(2020, 1, 20).getTime()
    const timeStampOld = new Date(2020, 1, 19).getTime()
    const timeStampNewest = new Date(2020, 1, 21).getTime()

    before(async () => {
      shared.checkToken(server, path)
      // get list of results accessible for current user
      let response = await server.set('Authorization', `Bearer ${shared.token}`).get(path)

      assert.equal(response.statusCode, 200)
      assert.isAtLeast(response.body.data.length, 1)
      const resultId = response.body.data[0].id

      // get result by resultId
      response = await server.set('Authorization', `Bearer ${shared.token}`).get(`${path}/${resultId}`)

      assertResult(response)
      result = response.body.data
      assert.isNotNull(result)

      // keep original result values which will be changed during the test
      ;[{ reportableSiteId, resultStatusLogId }] = [result]

      // get list of accessible sites for current user
      response = await server.set('Authorization', `Bearer ${shared.token}`).get(`/api/site`)
      assert.equal(response.statusCode, 200)
      assert.isAtLeast(response.body.data.length, 1)
      const sites = response.body.data
      const otherSites = sites.filter(x => x.id !== reportableSiteId)
      ;[newSite1, newSite2] = otherSites
      assert.isNotNull(newSite1)
      assert.isNotNull(newSite2)
    })

    after(async () => {
      // restore initial data
      await knex('Result').where('id', result.id).update({ reportableSiteId, resultStatusLogId })
      await knex('ResultStatusLog')
        // assume resultStatusLogId is 0 if `result` didn't have any record in ResultStatusLog
        .where('id', '>', resultStatusLogId || 0)
        .where({ resultId: result.id })
        .del()
    })

    it('Should change result.reportableSiteId and add ResultStatusLog', async () => {
      // transfer result to newSite1
      const response = await server
        .set('Authorization', `Bearer ${shared.token}`)
        .post(`${path}/transfer/${result.id}`)
        .send({ siteId: newSite1.id, timestamp: timeStampNew })

      assertResult(response)
      const testResult = response.body.data
      assert.notEqual(testResult.reportableSiteId, reportableSiteId)
      assert.equal(testResult.reportableSiteId, newSite1.id)

      // check how Joi.date() handles DateTime - transferredOn should contain 'date' and 'time' parts.
      // FYI: 'transferredOn' is expected in this format - '2020-01-07T15:27:46.000Z'
      const { transferredOn } = testResult
      // length of Date portion = 10, length of Time portion = 14
      assert.equal(transferredOn.length, 24)
    })

    it('should return an error if result does not exist', async () => {
      // get max resultId
      const [{ resultId }] = await knex('Result').max('id as resultId')

      // transfer unknown resultId
      const response = await server
        .set('Authorization', `Bearer ${shared.token}`)
        .post(`${path}/transfer/${resultId + 1}`)
        .send({ siteId: 1 })

      assert.equal(response.statusCode, 404)
    })

    it('Should NOT transfer result to newSite2 because of older timeStamp', async () => {
      const response = await server
        .set('Authorization', `Bearer ${shared.token}`)
        .post(`${path}/transfer/${result.id}`)
        // try to transfer same result to 2nd site but pass older timeStamp
        .send({ siteId: newSite2.id, timestamp: timeStampOld })

      assertResult(response)
      const testResult = response.body.data
      // reportableSiteId is not equal to requested newSite2
      assert.notEqual(testResult.reportableSiteId, newSite2.id)
      // reportableSiteId is equal to previously processed newSite1 with newer timeStamp
      assert.equal(testResult.reportableSiteId, newSite1.id)
    })

    it('Should transfer result to newSite2 with comment and newer timeStamp', async () => {
      const comment = 'Some comment'
      const response = await server
        .set('Authorization', `Bearer ${shared.token}`)
        .post(`${path}/transfer/${result.id}`)
        // try transfer same result to 2nd site with newer timeStamp
        .send({
          siteId: newSite2.id,
          timestamp: timeStampNewest,
          comment,
        })

      assertResult(response)
      const testResult = response.body.data
      // reportableSiteId is equal to requested newSite2
      assert.equal(testResult.reportableSiteId, newSite2.id)

      // check if comment stored
      const { resultStatusLogId } = testResult
      const logData = await knex('ResultStatusLog').where('id', resultStatusLogId).first('data')
      const log = JSON.parse(logData.data)
      assert.equal(comment, log.comment)
    })
  })
})
