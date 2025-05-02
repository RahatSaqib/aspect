const chai = require('chai')
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const { getAccessToken } = require('../utils/authUtils')

const { assert } = chai

describe('Mobile API Custom Fields', () => {
  const path = '/mobile/api/v4/custom-fields'

  let lastPartnerId

  before(async () => {
    // The user with ID 1 is assigned to a partner with ID 1, which is not an operating partner.
    // To ensure the tests use an operating partner without affecting other test cases, adjustments were made accordingly.
    ;({ lastPartnerId } = await knex('Person').where('userId', 1).first('lastPartnerId'))
    const partner = await knex('Partner')
      .where('partnerTypeId', await partnerTypeToId('operating'))
      .orderBy('id', 'desc')
      .first()
    await knex('Person').where('userId', 1).update({
      lastPartnerId: partner.id,
    })
    shared.checkToken(server, path)
  })

  after(async () => {
    await knex('Person').where('userId', 1).update({
      lastPartnerId,
    })
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
      assert.equal(response.body.data[0].formTypeId, 'clinicalResponseForm')
      assert.equal(response.body.data[0].fields.length, 1)
      assert.containsAllKeys(response.body.data[0].fields[0], [
        'name',
        'title',
        'i18nKey',
        'fieldType',
        'order',
        'caption',
        'i18nKeyCaption',
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
