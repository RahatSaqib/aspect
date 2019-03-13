const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Assay routes', () => {
  const path = '/api/assay'
  shared.checkToken(server, path)
  describe('GET', () => {
    it('should return a list of assays when using valid token', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 3)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'assayTypeId')
          assert.property(res.body.data[0], 'deviceTypeId')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'assayTypeName')
          assert.property(res.body.data[0], 'deviceTypeName')
          assert.property(res.body.data[0], 'hasResults')
          assert.property(res.body.data[0], 'resultDataSchema')
          assert.property(res.body.data[0], 'assayTypeAbbreviation')
          assert.property(res.body.data[0], 'abbreviation')
          assert.property(res.body, 'total')
          done()
        })
    })
    describe('GET /assayresultandpatientschema', () => {
      it('should return a list of assays patient and result and schema data', done => {
        server
          .get(`${path}resultandpatientschema`)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Array')
            assert.isAbove(res.body.length, 0)
            assert.property(res.body[0], 'id')
            assert.property(res.body[0], 'resultDataSchema')
            assert.property(res.body[0], 'patientDataSchema')
            assert.property(res.body[0], 'resultCategories')
            assert.property(res.body[0], 'assayTypeId')
            assert.property(res.body[0], 'name')
            assert.property(res.body[0], 'assayTypeName')
            assert.property(res.body[0], 'deviceTypeId')
            assert.property(res.body[0], 'deviceTypeName')
            assert.property(res.body[0], 'deviceTypeId')
            assert.property(res.body[0], 'resultCategory1Label')
            assert.property(res.body[0], 'resultCategory1i18nKey')
            assert.property(res.body[0], 'resultCategory2Label')
            assert.property(res.body[0], 'resultCategory2i18nKey')
            done()
          })
      })
    })
  })
})
