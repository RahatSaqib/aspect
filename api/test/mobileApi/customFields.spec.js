const chai = require('chai')
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')

const { assert } = chai

describe('Mobile API Custom Fields', () => {
  const path = '/mobile/api/v4/custom-fields'

  before(async () => {
    shared.checkToken(server, path)
  })

  describe('GET', () => {
    it('should return custom fields for given external IDs', async () => {
      const response = await server
        .get(`${path}?deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.status, 200)
      assert.property(response.body, 'data')
      assert.isArray(response.body.data)
      assert.equal(response.body.data.length, 1)

      assert.equal(response.body.data[0].fields.length, 12)
      assert.containsAllKeys(response.body.data[0], ['fields'])

      // First field in ClinicalResponse.json (PatientAge) has no `id`; pick() only returns keys present on the field.
      assert.containsAllKeys(response.body.data[0].fields[0], [
        'id',
        'name',
        'items',
        'title',
        'fieldType',
        'order',
        'controlType',
      ])
    })

    it('should filter by deviceType: include general forms and forms matching the device type', async () => {
      const response = await server
        .get(`${path}?deviceType=CepheidGeneXpert`)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.status, 200)
      assert.isArray(response.body.data)
      assert.isAtLeast(response.body.data.length, 1)
      response.body.data.forEach(form => {
        const general = form.deviceTypeExternalId == null
        const matchesDeviceType = form.deviceTypeExternalId === 'CepheidGeneXpert'
        assert.isTrue(
          general || matchesDeviceType,
          'each form is general (no device type on assay) or matches the deviceType filter'
        )
      })
    })
  })
})
