const chai = require('chai')
const chaiSubset = require('chai-subset')
const Promise = require('bluebird')
const { knex } = require('../../src/db')
const { decrypt } = require('../../src/shared/encryption')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { waitAsyncComplete } = require('../utils/generatorFunctionUtils')
const { deviceApiRawStatusToId } = require('../../src/shared/dictionary')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('Device API Raw routes', () => {
  const deviceApiRawPath = '/device/raw'

  describe('Unauthorised scenarios', () => {
    describe('when no device API key is specified', () => {
      it('should respond with 401: Unauthorized', async () => {
        const response = await server.post(deviceApiRawPath).send({ data: { a: 'b' } })
        assert.equal(response.statusCode, 401)
        assert.equal(response.body.error, 'Unauthorized')
      })
    })

    describe('when an unknown device API key is specified', () => {
      it('should respond with 401: Unauthorized', async () => {
        const response = await server
          .post(deviceApiRawPath)
          .set('Authorization', 'Bearer invalid18zz450chxhu0')
          .send({ data: { a: 'b' } })
        assert.equal(response.statusCode, 401)
        assert.equal(response.body.error, 'Unauthorized')
      })
    })

    describe('when a revoked device API key is specified', () => {
      const revokedApiKeyToken = randomToken()
      beforeEach(async () => {
        const revokedKeyInDatabase = await knex('DeviceApiKey').where('token', revokedApiKeyToken).first()
        const now = new Date()
        if (revokedKeyInDatabase && !revokedKeyInDatabase.revoked) {
          await knex('DeviceApiKey').where('id', revokedKeyInDatabase.id).update({ revoked: true, updatedOn: now })
        } else if (!revokedKeyInDatabase) {
          const { id: userId, partnerId } = await knex('User as u')
            .innerJoin('Person as p', 'u.id', 'p.userId')
            .first('u.id', 'p.lastPartnerId as partnerId')
          await knex('DeviceApiKey').insert({
            token: revokedApiKeyToken,
            revoked: true,
            createdOn: now,
            createdBy: userId,
            updatedOn: now,
            updatedBy: userId,
            partnerId,
          })
        }
      })

      afterEach(async () => {
        const { id: deviceApiKeyId } = (await knex('DeviceApiKey').where('token', revokedApiKeyToken).first('id')) || {}
        if (deviceApiKeyId) {
          await knex('DeviceApiKey').where('id', deviceApiKeyId).del()
        }
      })

      it('should respond with 401: Unauthorized', async () => {
        const response = await server
          .post(deviceApiRawPath)
          .set('Authorization', `Bearer ${revokedApiKeyToken}`)
          .send({ data: { a: 'b' } })
        assert.equal(response.statusCode, 401)
        assert.equal(response.body.error, 'Unauthorized')
      })
    })
  })

  describe('Authorised scenarios', () => {
    const validApiKeyToken = randomToken()
    beforeEach(async () => {
      const validKeyInDatabase = await knex('DeviceApiKey').where('token', validApiKeyToken).first()
      const now = new Date()
      if (validKeyInDatabase && validKeyInDatabase.revoked) {
        await knex('DeviceApiKey').where('id', validKeyInDatabase.id).update({ revoked: false, updatedOn: now })
      } else if (!validKeyInDatabase) {
        const { id: userId, partnerId } = await knex('User as u')
          .innerJoin('Person as p', 'u.id', 'p.userId')
          .first('u.id', 'p.lastPartnerId as partnerId')
        await knex('DeviceApiKey').insert({
          token: validApiKeyToken,
          revoked: false,
          createdOn: now,
          createdBy: userId,
          updatedOn: now,
          updatedBy: userId,
          partnerId,
        })
      }
    })

    afterEach(async () => {
      await waitAsyncComplete()
      const {
        id: deviceApiKeyId,
        deviceId,
        siteId,
      } = await knex('DeviceApiKey as dak')
        .leftJoin('Device as d', 'dak.deviceId', 'd.id')
        .where('dak.token', validApiKeyToken)
        .first('dak.id', 'dak.deviceId', 'd.siteId')
      const resultIds = await knex('Result').where('deviceId', deviceId).pluck('id')

      const opIds = await knex('DeviceOperation').where('deviceId', deviceId).pluck('id')
      const issueIds = await knex('Issue').where('deviceId', deviceId).pluck('id')
      await knex('DeviceApprovalLog').where('deviceId', deviceId).delete()
      await knex('DeviceLog').where('deviceId', deviceId).orWhereIn('resultId', resultIds).delete()
      await knex('DeviceOperation').whereIn('id', opIds).delete()
      await knex('FactDeviceFlag').where('deviceId', deviceId).delete()
      await knex('DeviceSiteHistory').where('deviceId', deviceId).delete()
      await knex('FactResultsDevice').where('deviceId', deviceId).delete()
      await knex('FactResultsDeviceByAssay').where('deviceId', deviceId).delete()
      await knex('FactResultsDeviceByCategory1').where('deviceId', deviceId).delete()
      await knex('DeviceApiRaw').where({ deviceApiKeyId }).delete()
      await knex('DeviceApiKey').where('token', validApiKeyToken).orWhere('deviceId', deviceId).delete()
      await knex('Device').where('id', deviceId).delete()
      const inventoryItemIds = await knex('InventoryItem as ii')
        .where('ii.siteId', siteId)
        .distinct('ii.id')
        .pluck('ii.id')
      await knex('InventoryLog').whereIn('inventoryItemId', inventoryItemIds).delete()
      await knex('InventoryItem').whereIn('id', inventoryItemIds).delete()
      await knex('IssueEvent')
        .whereIn('issueId', issueIds)
        .orWhere(function () {
          if (resultIds != null && resultIds.length > 0) {
            this.whereRaw(`JSON_EXTRACT(data, "$.resultId") IN (${resultIds.join(',')})`)
          }
        })
        .delete()
      await knex('InventoryLog').whereIn('resultId', resultIds).delete()
      await knex('ResultQualityControlLog').whereIn('resultId', resultIds).delete()
      await knex('ResultWorkflowLog').whereIn('resultId', resultIds).delete()
      await knex('ResultTag').whereIn('sourceResultId', resultIds).delete()
      await knex('Result').whereIn('id', resultIds).delete()
      await knex('Sample').where('originSiteId', siteId).delete()
      await knex('Site').where('id', siteId).delete()
    })

    it('should save the request in DeviceApiRaw and respond with the record ID', async () => {
      const payload = { data: { message: 'This payload will be encrypted' } }
      const response = await server
        .post(
          `${deviceApiRawPath}/some/path/params?someParamName=some_param_value&anotherParamName=another%20param%20value`
        )
        .set('Authorization', `Bearer ${validApiKeyToken}`)
        .send(payload)
      assert.equal(response.statusCode, 200)
      await Promise.delay(2000)
      const deviceApiRawRecord = await knex('DeviceApiRaw').where({ id: response.body }).first()
      const deviceApiKey = JSON.parse(
        JSON.stringify(await knex('DeviceApiKey').where('token', validApiKeyToken).first())
      )
      const deviceApiKeySnapshot = JSON.parse(JSON.stringify(deviceApiRawRecord.deviceApiKeySnapshot))
      expect(JSON.parse(deviceApiKeySnapshot)).to.deep.equal(deviceApiKey)
      const decryptedRequestData = JSON.parse(
        deviceApiRawRecord.salt
          ? decrypt(deviceApiRawRecord.rawData, deviceApiRawRecord.salt)
          : deviceApiRawRecord.rawData
      )
      expect(decryptedRequestData.payload).to.deep.equal(payload)
      expect(decryptedRequestData.params).to.deep.equal({
        params: 'some/path/params',
      })
      expect(decryptedRequestData.query).to.deep.equal({
        someParamName: 'some_param_value',
        anotherParamName: 'another param value',
      })
      expect(decryptedRequestData.auth.credentials.token).to.equal(validApiKeyToken)
      const processedStatusId = await deviceApiRawStatusToId('Processed')
      expect(deviceApiRawRecord.deviceApiRawStatusId).to.equal(processedStatusId)
    })
  })
})
