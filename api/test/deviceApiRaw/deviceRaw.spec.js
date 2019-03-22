const supertest = require('supertest')
const chai = require('chai')
const { knex } = require('../../src/db')
const { getUtcTime } = require('../../src/shared/date')
const { decrypt } = require('../../src/shared/encryption')
const { randomToken } = require('../../src/deviceApi/apiKey')

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
      const { id: deviceApiKeyId } =
        (await knex('DeviceApiKey')
          .where('token', validApiKeyToken)
          .first('id')) || {}
      if (deviceApiKeyId) {
        await knex('DeviceApiRaw')
          .where({ deviceApiKeyId })
          .del()
        await knex('DeviceApiKey')
          .where('id', deviceApiKeyId)
          .del()
      }
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
        type: {
          id: 'CepheidGeneXpert',
        },
      }
      const geneXpertResponse = await server
        .post(deviceApiRawPath)
        .set('Authorization', `Bearer ${validApiKeyToken}`)
        .send(geneXpertPayload)
      assert.equal(geneXpertResponse.statusCode, 200)
      const geneXpertDeviceApiRawRecord = await knex('DeviceApiRaw')
        .where({ id: geneXpertResponse.body })
        .first()
      assert.equal(
        geneXpertDeviceApiRawRecord.dataProcessor,
        'DefaultCepheidGeneXpert'
      )

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
        'Default'
      )
    })
  })
})
