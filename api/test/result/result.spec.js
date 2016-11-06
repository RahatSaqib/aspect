let supertest = require('supertest')
let chai = require('chai')
let shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Result routes',function(){

  let path = '/api/result'
  let resultId = 1
  let assayId = 1

  describe('GET',function(){

    shared.checkToken(server, path)

    it('should return a list of results', function(done){
      server
      .get(path)
      .set('Authorization', 'Bearer '+shared.token)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 5)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'endedOn')
        assert.property(res.body.data[0], 'deviceName')
        assert.property(res.body.data[0], 'countryName')
        assert.property(res.body.data[0], 'stateName')
        assert.property(res.body.data[0], 'lgaName')
        assert.property(res.body.data[0], 'sampleId')
        assert.property(res.body.data[0], 'patientId')
        assert.property(res.body.data[0], 'assayName')
        assert.property(res.body, 'total')

        resultId = res.body.data[0].id
        assayId = res.body.data[0].assayId

        done()
      })
    })

    it('should return a list of results with assay-specific fields if TB assay is requested', function(done){
      server
      .get(path + '?assayId=' + assayId)
      .set('Authorization', 'Bearer '+shared.token)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 5)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'endedOn')
        assert.property(res.body.data[0], 'deviceName')
        assert.property(res.body.data[0], 'countryName')
        assert.property(res.body.data[0], 'stateName')
        assert.property(res.body.data[0], 'lgaName')
        assert.property(res.body.data[0], 'sampleId')
        assert.property(res.body.data[0], 'patientId')
        assert.property(res.body.data[0], 'assayName')
        assert.property(res.body.data[0], 'resultCategory1Name')
        assert.property(res.body.data[0], 'resultCategory2Name')
        assert.property(res.body, 'total')
        assert.typeOf(res.body.extraColumns, 'array')
        done()
      })
    })

    it('should return a single result', function(done){
      server
      .get(path + '/' + resultId)
      .set('Authorization', 'Bearer '+shared.token)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'Object')
        assert.property(res.body.data, 'id')
        assert.property(res.body.data, 'endedOn')
        assert.property(res.body.data, 'deviceName')
        assert.property(res.body.data, 'countryName')
        assert.property(res.body.data, 'stateName')
        assert.property(res.body.data, 'lgaName')
        assert.property(res.body.data, 'resultCategory1Name')
        assert.property(res.body.data, 'resultCategory2Name')
        assert.property(res.body.data, 'resultData')
        assert.typeOf(res.body.data.resultData, 'Object')
        assert.property(res.body.data, 'sampleId')
        assert.property(res.body.data, 'patientId')
        assert.property(res.body.data, 'siteName')
        assert.property(res.body.data, 'assayVersion')
        assert.property(res.body.data, 'consumableSerial')
        assert.property(res.body.data, 'consumableLot')
        assert.property(res.body.data, 'consumableExpirationDate')
        assert.property(res.body.data, 'instrumentSerial')
        assert.property(res.body.data, 'moduleName')
        assert.property(res.body.data, 'moduleSerial')
        assert.property(res.body.data, 'researchId')
        assert.property(res.body.data, 'senderVersion')
        assert.property(res.body.data, 'senderOperator')
        assert.property(res.body.data, 'notes')
        assert.property(res.body.data, 'errorCode')
        assert.property(res.body.data, 'errorNotes')
        assert.property(res.body.data, 'createdOn')
        assert.property(res.body.data, 'updatedOn')
        assert.property(res.body.data, 'assayId')
        assert.property(res.body.data, 'assay')
        assert.typeOf(res.body.data.assay, 'Object')
        assert.property(res.body.data.assay, 'id')
        assert.property(res.body.data.assay, 'name')
        assert.property(res.body.data.assay, 'i18nKey')
        assert.property(res.body.data.assay, 'assayTypeId')
        assert.property(res.body.data.assay, 'deviceTypeId')
        assert.property(res.body.data.assay, 'resultCategory1Label')
        assert.property(res.body.data.assay, 'resultCategory1i18nKey')
        assert.property(res.body.data.assay, 'resultCategory2Label')
        assert.property(res.body.data.assay, 'resultCategory2i18nKey')
        assert.property(res.body.data.assay, 'resultDataSchema')
        assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
        done()
      })
    })

  })
})

describe('Result type routes',function(){

  let path = '/api/result/result-types'

  describe('GET',function(){

    shared.checkToken(server, path)

    it('should return a list of result types when using valid token', function(done){
      server
      .get(path)
      .set('Authorization', 'Bearer '+shared.token)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 5)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'name')
        assert.property(res.body, 'total')
        done()
      })
    })
  })
})
