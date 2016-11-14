let supertest = require('supertest')
let chai = require('chai')
let shared = require('../utils/sharedToken')
let _ = require('lodash')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Result routes',function(){

  let path = '/api/result'
  let resultId = 1
  let assayId = 1
  let initialResultWorkflowStatus = ''
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
        initialResultWorkflowStatus = res.body.data[0].resultWorkflowStatus

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
  describe('PUT',function(){
    it('Should update result status given a resultId', function(done){
      let updateWithToken = {
        resultWorkflowStatusId: null,
        token: 'processed'
      }
      let updateWithId = {
        resultWorkflowStatusId: 1,
        token: null
      }

      //update with token
      server
        .put(path + '/workflow-status/' + resultId)
        .send(updateWithToken)
        .set('Authorization', 'Bearer' + shared.token)
        .end(function(err, res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.assay, 'Object')
          assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          const resultFieldNames = ['id', 'endedOn', 'deviceName', 'countryName',
            'stateName', 'lgaName', 'resultCategory1Name', 'resultCategory2Name',
            'resultData','sampleId', 'patientId', 'siteName', 'assayVersion',
            'consumableSerial', 'consumableLot', 'consumableExpirationDate',
            'instrumentSerial', 'moduleName', 'moduleSerial', 'researchId',
            'senderVersion', 'senderOperator', 'notes', 'errorCode', 'errorNotes',
            'createdOn', 'updatedOn', 'assayId', 'assay']
          _.each(resultFieldNames, function(fieldName){
            assert.property(res.body.data, fieldName)
          })

          //check the updated fieldName
          assert.equal(res.body.data.resultWorkflowStatus, 'Processed')
          
          //update with resultWorkflowStatusId
          server
            .put(path + '/workflow-status/' + resultId)
            .send(updateWithId)
            .set('Authorization', 'Bearer' + shared.token)
            .end(function(err, res){
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'Object')
              assert.typeOf(res.body.data.assay, 'Object')
              assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
              assert.typeOf(res.body.data.resultData, 'Object')
              const resultFieldNames = ['id', 'endedOn', 'deviceName', 'countryName',
                'stateName', 'lgaName', 'resultCategory1Name', 'resultCategory2Name',
                'resultData','sampleId', 'patientId', 'siteName', 'assayVersion',
                'consumableSerial', 'consumableLot', 'consumableExpirationDate',
                'instrumentSerial', 'moduleName', 'moduleSerial', 'researchId',
                'senderVersion', 'senderOperator', 'notes', 'errorCode', 'errorNotes',
                'createdOn', 'updatedOn', 'assayId', 'assay']
              _.each(resultFieldNames, function(fieldName){
                assert.property(res.body.data, fieldName)
              })

              //check if resultWorkflowStatus was updated
              assert.equal(res.body.data.resultWorkflowStatus, 'OK')

              // Check if update persisted
              server
                .get('/api/result/' + resultId)
                .set('Authorization', 'Bearer' + shared.token)
                .end(function(err,res){
                  assert.equal(res.body.data.resultWorkflowStatus, 'OK')
                  
                  // Clean Up: Update resultWorkflowStatus with original status
                  server
                    .put(path + '/workflow-status/' + resultId)
                    .send({resultWorkflowStatusId: null, token: initialResultWorkflowStatus})
                    .set('Authorization', 'Bearer' + shared.token)
                    .end(function(err, res){
                      assert.equal(res.body.data.resultWorkflowStatus, initialResultWorkflowStatus)
                      done()
                    })
                })

            })

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
