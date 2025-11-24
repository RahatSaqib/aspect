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
      assert.containsAllKeys(response.body.data[0], ['formDefinitionExternalId', 'fields'])
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

    it('should return 400 if externalIds parameter is missing', async () => {
      const response = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(response.status, 400)
    })
  })
})
