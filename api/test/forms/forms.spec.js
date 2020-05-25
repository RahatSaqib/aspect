const chai = require('chai')
const supertest = require('supertest')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { diseaseToId } = require('../../src/shared/dictionary')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Forms routes', () => {
  const path = '/api/get-forms'
  shared.checkToken(server, path)
  describe('GET', () => {
    it('should return a form by disease', async () => {
      const diseaseId = await diseaseToId('tb')
      const res = await server
        .get(`${path}?diseaseId=${diseaseId}`)
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      const { TBProbes, TBResult } = res.body
      assert.isTrue(!_.isNil(res.body))
      assert.isTrue(!_.isNil(TBProbes))
      assert.isTrue(!_.isNil(TBResult))
      assert.property(TBProbes, 'diseaseId')
      assert.property(TBProbes, 'assayId')
      assert.hasAllKeys(TBProbes.fields[0], [
        'name',
        'i18nKey',
        'fieldType',
        'order',
        'caption',
        'i18nKeyCaption',
        'controlType',
      ])
      assert.property(TBProbes, 'formTypeId')
      assert.property(TBProbes, 'fields')
      assert.typeOf(TBProbes.fields, 'array')
      assert.property(TBProbes, 'refForms')
    })
  })
})
