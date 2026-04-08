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
        'fields',
      ])
      assert.isNull(response.body.data[0].assayExternalId)
      assert.isNull(response.body.data[0].diseaseExternalId)
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
  })
})
