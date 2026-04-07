const chai = require('chai')
const server = require('../utils/testUtils')
const { clientTypes } = require('../../src/auth/service')

const { expect, assert } = chai

const getClinicianAccessToken = async () => {
  const res = await server.post('/api/auth').send({
    name: 'clinician',
    password: 'test07',
    clientName: 'Mocha web',
  })
  return res.body.access
}

describe('Mobile API sites', () => {
  let clinicianAccessToken = ''
  const path = '/mobile/api/v4/sites'

  before(async () => {
    clinicianAccessToken = await getClinicianAccessToken()
  })

  const authHeaders = () => ({
    Authorization: `Bearer ${clinicianAccessToken}`,
    'api-version': '4',
  })

  describe('GET /v4/sites', () => {
    it('should return 200 with ok and data array', async () => {
      const response = await server.get(path).set(authHeaders())

      expect(response.status).to.equal(200)
      expect(response.body).to.have.property('ok', true)
      expect(response.body).to.have.property('data')
      assert.isArray(response.body.data)
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).to.include.keys(
          'id',
          'name',
          'shortName',
          'state',
          'lga',
          'externalId',
          'sampleRegistrationAllowed',
          'onlyForTransfers'
        )
      }
    })

    it('should return 400 when nameContains is shorter than three characters', async () => {
      const response = await server.get(path).set(authHeaders()).query({ nameContains: 'ab' })

      expect(response.status).to.equal(400)
    })

    it('should return only sites whose name contains nameContains', async () => {
      const baseline = await server.get(path).set(authHeaders())
      expect(baseline.status).to.equal(200)
      const withSubstring = baseline.body.data.find(s => s.name && s.name.length >= 3)
      if (!withSubstring) {
        return
      }
      const needle = withSubstring.name.slice(0, 3)
      const filtered = await server.get(path).set(authHeaders()).query({ nameContains: needle })

      expect(filtered.status).to.equal(200)
      assert.isAtMost(filtered.body.data.length, baseline.body.data.length)
      filtered.body.data.forEach(site => {
        expect(site.name.toLowerCase()).to.include(needle.toLowerCase())
      })
    })

    it('should return no sites when modifiedSince is far in the future', async () => {
      const response = await server.get(path).set(authHeaders()).query({ modifiedSince: '2099-01-01T00:00:00.000Z' })

      expect(response.status).to.equal(200)
      expect(response.body.data).to.be.an('array').that.has.length(0)
    })

    it('should return 400 when modifiedSince is not a valid ISO date', async () => {
      const response = await server.get(path).set(authHeaders()).query({ modifiedSince: 'invalid' })

      expect(response.status).to.equal(400)
    })

    it('should return assigned-only sites for true_connect; onlyForTransfers is contract noise (always false, ignore semantically)', async () => {
      const login = await server.post('/api/auth').send({
        name: 'admin',
        password: 'test07',
        clientName: 'Mocha True Connect sites',
        clientType: clientTypes.true_connect,
      })
      expect(login.status).to.equal(200)
      const response = await server.get(path).set({
        Authorization: `Bearer ${login.body.access}`,
        'api-version': '4',
      })
      expect(response.status).to.equal(200)
      // Same JSON shape as reporter_app; onlyForTransfers is not meaningful for true_connect—always false.
      response.body.data.forEach(site => {
        expect(site.onlyForTransfers).to.equal(false)
      })
    })
  })
})
