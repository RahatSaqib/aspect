const chai = require('chai')
const _ = require('lodash')
const uuid = require('node-uuid')

const { knex } = require('../../src/db')
const server = require('../utils/testUtils')

const { assert, expect } = chai

const clinicianUsername = 'admin'
const clinicianPassword = 'test07'
const getClinicianAccessToken = async () => {
  const res = await server.post('/api/auth').send({
    name: clinicianUsername,
    password: clinicianPassword,
    clientName: 'Mocha web',
  })
  return res.body.access
}

const getAvailableSites = async clinicianAccessToken => {
  const res = await server.get('/api/site/select-list/reporter').set('Authorization', `Bearer ${clinicianAccessToken}`)
  return res.body.data
}

const getLastSampleId = async () => {
  const { id } = await knex('Sample').orderBy('id', 'desc').first('id')
  return id
}

describe('Mobile API Sample Registration', () => {
  const path = '/mobile/api/sample/register'

  let clinicianAccessToken = ''
  let availableSites
  let lastSampleId

  before(async () => {
    clinicianAccessToken = await getClinicianAccessToken()
    lastSampleId = await getLastSampleId()
    availableSites = await getAvailableSites(clinicianAccessToken)
    assert.isAtLeast(availableSites.length, 1, 'Clinician needs to be able to register sample at least 1 site.')
  })

  afterEach(async () => {
    const samplesToDelete = await knex('Sample').where('id', '>', lastSampleId).select('id')
    await knex('Sample').whereIn('id', _.map(samplesToDelete, 'id')).delete()
  })

  describe('POST', () => {
    it('should create a new sample', async () => {
      const newSampleId = uuid.v4()
      const sampleCollectedOn = new Date(2023, 2, 14)
      const samplePayload = {
        externalId: newSampleId,
        collectedOn: sampleCollectedOn.toISOString(),
        clinicianName: 'Jen Harrelson',
        patientExternalId: 'J.Harrelson',
        originSiteId: availableSites[0].id,
        sampleTypeExternalId: 'Pus',
      }
      const res = await server
        .post(path)
        .set('Authorization', `Bearer ${clinicianAccessToken}`)
        .set('api-version', `4`)
        .send(samplePayload)

      expect(res.body).to.containSubset({
        ok: true,
        data: {
          externalId: newSampleId,
          originSite: {
            name: availableSites[0].name,
          },
          sampleType: {
            externalId: samplePayload.sampleTypeExternalId,
          },
          status: {
            id: 'SAMPLE_REGISTERED',
          },
          collectedOn: samplePayload.collectedOn,
        },
      })
      assert.property(res.body.data, 'id')
      assert.property(res.body.data, 'updatedOn')
    })
  })
})
