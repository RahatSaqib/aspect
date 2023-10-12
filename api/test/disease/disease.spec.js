const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const shared = require('../utils/sharedToken')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('Disease routes', () => {
  const path = '/api/diseases'
  before(() => {
    shared.checkToken(server, path)
  })
  describe('GET', () => {
    it('should return a list of disease when using valid token', async () => {
      const diseaseResponse = await server.get(path).set('Authorization', `Bearer ${shared.token}`)
      assert.equal(diseaseResponse.status, 200)
      assert.typeOf(diseaseResponse.body, 'Object')
      assert.property(diseaseResponse.body, 'data')
      assert.property(diseaseResponse.body, 'total')
      assert.property(diseaseResponse.body, 'length')
      assert.property(diseaseResponse.body, 'ok')

      assert.typeOf(diseaseResponse.body.data, 'array')

      const { data } = diseaseResponse.body
      assert.isTrue(!_.isNil(data))

      assert.isTrue(!_.isNil(data.length))

      assert.isAtLeast(data.length, 8)
      const [disease] = data
      assert.property(disease, 'id')
      assert.property(disease, 'name')
      assert.property(disease, 'i18nKey')
      assert.property(disease, 'externalId')

      expect(_.map(data, elem => ({ externalId: elem.externalId }))).to.containSubset([
        {
          externalId: 'tb',
        },
        {
          externalId: 'ebola',
        },
        {
          externalId: 'hiv',
        },
        {
          externalId: 'hbv',
        },
        {
          externalId: 'hcv',
        },
        {
          externalId: 'zika',
        },
        {
          externalId: 'dengue',
        },
        {
          externalId: 'covid19',
        },
      ])
    })
  })
})
