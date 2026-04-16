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
        .get(`${path}?externalIds=ClinicalResponse`)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.status, 200)
      assert.property(response.body, 'data')
      assert.isArray(response.body.data)
      assert.equal(response.body.data.length, 1)
      assert.equal(response.body.data[0].formDefinitionExternalId, 'ClinicalResponse')
      assert.equal(response.body.data[0].fields.length, 6)
      assert.containsAllKeys(response.body.data[0], [
        'formDefinitionExternalId',
        'assayExternalId',
        'diseaseExternalId',
        'deviceTypeExternalId',
        'fields',
      ])
      assert.isNull(response.body.data[0].assayExternalId)
      assert.isNull(response.body.data[0].diseaseExternalId)
      assert.isNull(response.body.data[0].deviceTypeExternalId)
      // First field in ClinicalResponse.json (PatientAge) has no `id`; pick() only returns keys present on the field.
      assert.containsAllKeys(response.body.data[0].fields[0], [
        'name',
        'title',
        'fieldType',
        'order',
        'controlType',
        'mandatory',
        'validation',
        'condition',
      ])
    })

    it('should return all partner form definitions when externalIds is omitted', async () => {
      const response = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.status, 200)
      assert.property(response.body, 'data')
      assert.isArray(response.body.data)
      assert.isAtLeast(response.body.data.length, 2)
      const tbForm = response.body.data.find(f => f.formDefinitionExternalId === 'CustomFieldsTB')
      assert.ok(tbForm)
      assert.equal(tbForm.diseaseExternalId, 'tb')
      assert.property(tbForm, 'assayExternalId')
    })

    it('should filter by disease using diseaseExternalId', async () => {
      const response = await server.get(`${path}?disease=tb`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.status, 200)
      assert.isArray(response.body.data)
      assert.isAtLeast(response.body.data.length, 1)
      response.body.data.forEach(form => {
        assert.equal(form.diseaseExternalId, 'tb')
      })
      assert.ok(response.body.data.some(f => f.formDefinitionExternalId === 'CustomFieldsTB'))
    })

    it('should filter by assay: include general forms and forms matching the assay', async () => {
      const response = await server.get(`${path}?assay=GxHiv1Vl`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.status, 200)
      assert.isArray(response.body.data)
      assert.isAtLeast(response.body.data.length, 1)
      response.body.data.forEach(form => {
        const general = form.assayExternalId == null
        const matchesAssay = form.assayExternalId === 'GxHiv1Vl'
        assert.isTrue(general || matchesAssay, 'each form is general (no assay) or matches the assay filter')
      })
      assert.ok(response.body.data.some(f => f.formDefinitionExternalId === 'CustomFieldsHIVVL'))
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
      assert.ok(response.body.data.some(f => f.formDefinitionExternalId === 'CustomFieldsHIVVL'))
    })

    it('should combine externalIds with assay and disease filters', async () => {
      const response = await server
        .get(`${path}?externalIds=ClinicalResponse&externalIds=CustomFieldsTB&externalIds=CustomFieldsHIVVL&disease=tb`)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.status, 200)
      assert.equal(response.body.data.length, 1)
      assert.equal(response.body.data[0].formDefinitionExternalId, 'CustomFieldsTB')
    })
  })
})
