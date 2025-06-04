// Add tests for the ENDPOINT: /v4/config/retrieve-app-id GET

const chai = require('chai')
const server = require('../utils/testUtils')

const { expect, assert } = chai

describe('Mobile API Config', () => {
  const path = '/mobile/api/v4/config/retrieve-app-id'

  describe('GET /v4/config/retrieve-app-id', () => {
    it('should return 400 status code when no device code is provided', async () => {
      const response = await server.get(path).set('api-version', '4')

      expect(response.status).to.equal(400)
    })

    it('should return app id in response body', async () => {
      const response = await server.get(path).set('api-version', '4').query({ deviceCode: '1234567890' })

      expect(response.status).to.equal(200)
      expect(response.body).to.have.property('ok', true)
      expect(response.body).to.have.property('data')
      expect(response.body.data).to.have.property('appId')
      assert.isString(response.body.data.appId)
      assert.lengthOf(response.body.data.appId, 3)
      assert.match(response.body.data.appId, /^[0-9]+$/)
    })

    it('should return 400 when device code is invalid', async () => {
      const response = await server.get(path).set('api-version', '4')

      expect(response.status).to.equal(400)
    })
  })
})
