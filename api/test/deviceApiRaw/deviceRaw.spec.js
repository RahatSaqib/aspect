const supertest = require('supertest')
const chai = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const { knex } = require('../../src/db')
const { getUtcTime } = require('../../src/shared/date')
const { decrypt } = require('../../src/shared/encryption')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { waitAsyncComplete } = require('../utils/generatorFunctionUtils')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Device API Raw routes', () => {
  const deviceApiRawPath = '/device/raw'

  describe('Unauthorised scenarios', () => {
    describe('when no device API key is specified', () => {
      it('should respond with 401: Unauthorized', async () => {
        const response = await server
          .post(deviceApiRawPath)
          .send({ data: { a: 'b' } })
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
        const revokedKeyInDatabase = await knex('DeviceApiKey')
          .where('token', revokedApiKeyToken)
          .first()
        const now = getUtcTime()
        if (revokedKeyInDatabase && !revokedKeyInDatabase.revoked) {
          await knex('DeviceApiKey')
            .where('id', revokedKeyInDatabase.id)
            .update({ revoked: true, updatedOn: now })
        } else if (!revokedKeyInDatabase) {
          const { id: userId } = await knex('User').first('id')
          await knex('DeviceApiKey').insert({
            token: revokedApiKeyToken,
            revoked: true,
            createdOn: now,
            createdBy: userId,
            updatedOn: now,
            updatedBy: userId,
          })
        }
      })

      afterEach(async () => {
        const { id: deviceApiKeyId } =
          (await knex('DeviceApiKey')
            .where('token', revokedApiKeyToken)
            .first('id')) || {}
        if (deviceApiKeyId) {
          await knex('DeviceApiKey')
            .where('id', deviceApiKeyId)
            .del()
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
      const validKeyInDatabase = await knex('DeviceApiKey')
        .where('token', validApiKeyToken)
        .first()
      const now = getUtcTime()
      if (validKeyInDatabase && validKeyInDatabase.revoked) {
        await knex('DeviceApiKey')
          .where('id', validKeyInDatabase.id)
          .update({ revoked: false, updatedOn: now })
      } else if (!validKeyInDatabase) {
        const { id: userId } = await knex('User').first('id')
        await knex('DeviceApiKey').insert({
          token: validApiKeyToken,
          revoked: false,
          createdOn: now,
          createdBy: userId,
          updatedOn: now,
          updatedBy: userId,
        })
      }
    })

    afterEach(async () => {
      await waitAsyncComplete()
      const { id: deviceApiKeyId, deviceId, siteId } = await knex(
        'DeviceApiKey as dak'
      )
        .leftJoin('Device as d', 'dak.deviceId', 'd.id')
        .where('dak.token', validApiKeyToken)
        .first('dak.id', 'dak.deviceId', 'd.siteId')
      const resultIds = await knex('Result')
        .where('deviceId', deviceId)
        .pluck('id')
        .union(function() {
          this.from('ResultGeneratedResult as rgr')
            .innerJoin('Result as r', 'rgr.sourceResultId', 'r.id')
            .where('r.deviceId', deviceId)
            .pluck('generatedResultId as id')
        })
      const opIds = await knex('DeviceOperation')
        .where('deviceId', deviceId)
        .map(op => op.id)
      const issueIds = await knex('Issue')
        .where('deviceId', deviceId)
        .pluck('id')
      await knex('DeviceStatusLog')
        .where('deviceId', deviceId)
        .delete()
      await knex('DeviceLog')
        .where('deviceId', deviceId)
        .orWhereIn('resultId', resultIds)
        .delete()
      await knex('DeviceOperation')
        .whereIn('id', opIds)
        .delete()
      await knex('FactDeviceFlag')
        .where('deviceId', deviceId)
        .delete()
      await knex('DeviceSiteHistory')
        .where('deviceId', deviceId)
        .delete()
      await knex('FactResultsDevice')
        .where('deviceId', deviceId)
        .delete()
      await knex('FactResultsDeviceByAssay')
        .where('deviceId', deviceId)
        .delete()
      await knex('FactResultsDeviceByCategory1')
        .where('deviceId', deviceId)
        .delete()
      await knex('FactResultsDeviceByCategory1And2')
        .where('deviceId', deviceId)
        .delete()
      await knex('DeviceApiRaw')
        .where({ deviceApiKeyId })
        .delete()
      await knex('DeviceApiKey')
        .where('token', validApiKeyToken)
        .orWhere('deviceId', deviceId)
        .delete()
      await knex('Device')
        .where('id', deviceId)
        .delete()
      const inventoryItemIds = await knex('InventoryItem as ii')
        .where('ii.siteId', siteId)
        .distinct('ii.id')
        .pluck('ii.id')
      await knex('InventoryLog')
        .whereIn('inventoryItemId', inventoryItemIds)
        .delete()
      await knex('InventoryItem')
        .whereIn('id', inventoryItemIds)
        .delete()
      await knex('IssueEvent')
        .whereIn('issueId', issueIds)
        .orWhere(function() {
          if (resultIds != null && resultIds.length > 0) {
            this.whereRaw(
              `JSON_EXTRACT(data, "$.resultId") IN (${resultIds.join(',')})`
            )
          }
        })
        .delete()
      await knex('InventoryLog')
        .whereIn('resultId', resultIds)
        .delete()
      await knex('ResultQualityControlLog')
        .whereIn('resultId', resultIds)
        .delete()
      await knex('ResultWorkflowLog')
        .whereIn('resultId', resultIds)
        .delete()
      await knex('ResultGeneratedResult')
        .whereIn('sourceResultId', resultIds)
        .orWhereIn('generatedResultId', resultIds)
        .delete()
      await knex('ResultTag')
        .whereIn('sourceResultId', resultIds)
        .delete()
      await knex('Result')
        .whereIn('id', resultIds)
        .delete()
      await knex('Sample')
        .where('originSiteId', siteId)
        .delete()
      await knex('Site')
        .where('id', siteId)
        .delete()
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
      const deviceApiRawRecord = await knex('DeviceApiRaw')
        .where({ id: response.body })
        .first()
      const deviceApiKey = JSON.parse(
        JSON.stringify(
          await knex('DeviceApiKey')
            .where('token', validApiKeyToken)
            .first()
        )
      )
      const deviceApiKeySnapshot = JSON.parse(
        JSON.stringify(deviceApiRawRecord.deviceApiKeySnapshot)
      )
      expect(JSON.parse(deviceApiKeySnapshot)).to.deep.equal(deviceApiKey)
      const decryptedRequestData = JSON.parse(
        decrypt(deviceApiRawRecord.rawData, deviceApiRawRecord.salt)
      )
      expect(decryptedRequestData.payload).to.deep.equal(payload)
      expect(decryptedRequestData.params).to.deep.equal({
        params: 'some/path/params',
      })
      expect(decryptedRequestData.query).to.deep.equal({
        someParamName: 'some_param_value',
        anotherParamName: 'another param value',
      })
      expect(decryptedRequestData.auth.credentials.token).to.equal(
        validApiKeyToken
      )
    })

    it('should process the request data using the correct data processor', async () => {
      const alereQPayload = {
        type: {
          id: 'AlereQ',
        },
      }
      const alereQResponse = await server
        .post(deviceApiRawPath)
        .set('Authorization', `Bearer ${validApiKeyToken}`)
        .send(alereQPayload)
      assert.equal(alereQResponse.statusCode, 200)
      const alereQDeviceApiRawRecord = await knex('DeviceApiRaw')
        .where({ id: alereQResponse.body })
        .first()
      assert.equal(alereQDeviceApiRawRecord.dataProcessor, 'DefaultAlereQ')

      const geneXpertPayload = {
        name: 'Raw GxConnect Test',
        type: {
          id: 'CepheidGeneXpert',
        },
        configuration: {
          data: {
            country: 'US',
          },
        },
      }
      const geneXpertResponse = await server
        .post(deviceApiRawPath)
        .set('Authorization', `Bearer ${validApiKeyToken}`)
        .send(geneXpertPayload)
      assert.equal(geneXpertResponse.statusCode, 200)

      const unknownPayload = {
        type: {
          id: 'Unknown',
        },
      }
      const unknownResponse = await server
        .post(deviceApiRawPath)
        .set('Authorization', `Bearer ${validApiKeyToken}`)
        .send(unknownPayload)
      assert.equal(unknownResponse.statusCode, 200)
      const unknownDeviceApiRawRecord = await knex('DeviceApiRaw')
        .where({ id: unknownResponse.body })
        .first()
      assert.equal(
        unknownDeviceApiRawRecord.dataProcessor,
        'DefaultDataProcessor'
      )
    })

    it('should be able to process many sequential requests for an asynchronous data processor', async () => {
      const alereQPayload = {
        type: {
          id: 'AlereQ',
        },
      }
      await Promise.each(_.range(100), async requestNumber => {
        const alereQResponse = await server
          .post(deviceApiRawPath)
          .set('Authorization', `Bearer ${validApiKeyToken}`)
          .send({ ...alereQPayload, requestNumber })
        assert.equal(alereQResponse.statusCode, 200)
        const alereQDeviceApiRawRecord = await knex('DeviceApiRaw')
          .where({ id: alereQResponse.body })
          .first()
        assert.equal(alereQDeviceApiRawRecord.dataProcessor, 'DefaultAlereQ')
      })
    })
  })
})
