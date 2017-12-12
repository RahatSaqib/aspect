const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Result routes', () => {
  const path = '/api/result'
  let resultId = 1
  let assayId = 1
  let initialResultWorkflowStatus = ''
  let initialResultWorkflowStatusName = ''
  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of results', () =>
      runTestWithKnex(function*(knex) {
        initialResultWorkflowStatusName = yield server
          .get(path)
          .set('Authorization', `Bearer ${shared.token}`)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 5)
            assert.property(res.body.data[0], 'id')
            assert.property(res.body.data[0], 'endedOn')
            assert.property(res.body.data[0], 'deviceName')
            assert.property(res.body.data[0], 'sampleOriginSiteName')
            assert.property(res.body.data[0], 'countryName')
            assert.property(res.body.data[0], 'stateName')
            assert.property(res.body.data[0], 'lgaName')
            assert.property(res.body.data[0], 'sampleId')
            assert.property(res.body.data[0], 'sampleGroup')
            assert.property(res.body.data[0], 'resultText')
            assert.property(res.body.data[0], 'resultWorkflowStatus')
            assert.property(res.body.data[0], 'patientId')
            assert.property(res.body.data[0], 'assayName')
            assert.property(res.body, 'total')

            ;[
              {
                id: resultId,
                assayId,
                resultWorkflowStatus: initialResultWorkflowStatus,
              },
            ] = res.body.data
            return res.body.data[0].resultWorkflowStatus
          })

        initialResultWorkflowStatus = (yield knex
          .from('ResultWorkflowStatus')
          .where({ name: initialResultWorkflowStatusName })
          .first('externalId')).externalId
      }))

    it('should return a list of results with assay-specific fields if TB assay is requested', done => {
      server
        .get(`${path}?assayId=${assayId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
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
          assert.property(res.body.data[0], 'sampleGroup')
          assert.property(res.body.data[0], 'patientId')
          assert.property(res.body.data[0], 'assayName')
          assert.property(res.body.data[0], 'resultCategory1Name')
          assert.property(res.body.data[0], 'resultCategory2Name')
          assert.property(res.body.data[0], 'resultText')
          assert.property(res.body.data[0], 'resultWorkflowStatus')
          assert.property(res.body, 'total')
          assert.typeOf(res.body.extraColumns, 'array')
          done()
        })
    })

    it('should return a single result', done => {
      server
        .get(`${path}/${resultId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
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
          assert.property(res.body.data, 'resultWorkflowStatusId')
          assert.property(res.body.data, 'resultWorkflowStatus')
          assert.property(res.body.data, 'resultWorkflowStatusExternalId')
          assert.property(res.body.data, 'resultData')
          assert.typeOf(res.body.data.resultData, 'Object')
          assert.property(res.body.data, 'sampleId')
          assert.property(res.body.data, 'sampleGroup')
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
          assert.property(res.body.data, 'qcCheck')
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

  describe('PUT', () => {
    it('Should update result status given a resultId', done => {
      const updateWithExternalId = {
        resultWorkflowStatusId: null,
        externalId: 'Validated',
      }
      const updateWithId = {
        resultWorkflowStatusId: 1,
        externalId: null,
      }

      // update with external ID
      server
        .put(`${path}/workflow-status/${resultId}`)
        .send(updateWithExternalId)
        .set('Authorization', `Bearer${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.typeOf(res.body.data.assay, 'Object')
          assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
          assert.typeOf(res.body.data.resultData, 'Object')
          const resultFieldNames = [
            'id',
            'endedOn',
            'deviceName',
            'countryName',
            'stateName',
            'lgaName',
            'resultCategory1Name',
            'resultCategory2Name',
            'resultData',
            'sampleId',
            'sampleGroup',
            'patientId',
            'siteName',
            'assayVersion',
            'consumableSerial',
            'consumableLot',
            'consumableExpirationDate',
            'instrumentSerial',
            'moduleName',
            'moduleSerial',
            'researchId',
            'senderVersion',
            'senderOperator',
            'notes',
            'errorCode',
            'errorNotes',
            'createdOn',
            'updatedOn',
            'assayId',
            'assay',
          ]
          _.each(resultFieldNames, fieldName => {
            assert.property(res.body.data, fieldName)
          })

          // check the updated fieldName
          assert.equal(res.body.data.resultWorkflowStatus, 'Validated')

          // update with resultWorkflowStatusId
          server
            .put(`${path}/workflow-status/${resultId}`)
            .send(updateWithId)
            .set('Authorization', `Bearer${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'Object')
              assert.typeOf(res.body.data.assay, 'Object')
              assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
              assert.typeOf(res.body.data.resultData, 'Object')
              const resultFieldNames = [
                'id',
                'endedOn',
                'deviceName',
                'countryName',
                'stateName',
                'lgaName',
                'resultCategory1Name',
                'resultCategory2Name',
                'resultData',
                'sampleId',
                'sampleGroup',
                'patientId',
                'siteName',
                'assayVersion',
                'consumableSerial',
                'consumableLot',
                'consumableExpirationDate',
                'instrumentSerial',
                'moduleName',
                'moduleSerial',
                'researchId',
                'senderVersion',
                'senderOperator',
                'notes',
                'errorCode',
                'errorNotes',
                'createdOn',
                'updatedOn',
                'assayId',
                'assay',
              ]
              _.each(resultFieldNames, fieldName => {
                assert.property(res.body.data, fieldName)
              })

              // check if resultWorkflowStatus was updated
              assert.equal(res.body.data.resultWorkflowStatus, 'OK')

              // Check if update persisted
              server
                .get(`/api/result/${resultId}`)
                .set('Authorization', `Bearer${shared.token}`)
                .end((err, res) => {
                  assert.equal(res.body.data.resultWorkflowStatus, 'OK')

                  // Clean Up: Update resultWorkflowStatus with original status
                  server
                    .put(`${path}/workflow-status/${resultId}`)
                    .send({
                      resultWorkflowStatusId: null,
                      externalId: initialResultWorkflowStatus,
                    })
                    .set('Authorization', `Bearer${shared.token}`)
                    .end((err, res) => {
                      assert.equal(
                        res.body.data.resultWorkflowStatus,
                        initialResultWorkflowStatusName
                      )
                      done()
                    })
                })
            })
        })
    })

    it('Updating "QC Check" should fail if not in status "Deliverable"', done => {
      // try settings
      server
        .put(`${path}/workflow-status/${resultId}`)
        .send({
          resultWorkflowStatusId: null,
          externalId: 'Validated',
        })
        .set('Authorization', `Bearer${shared.token}`)
        .end(() => {
          server
            .put(`${path}/qc-check/${resultId}`)
            .send({ qcCheck: true })
            .set('Authorization', `Bearer${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 400)
              done()
            })
        })
    })

    it('Should update "QC Check" given a resultId and boolean if in status "Deliverable"', done => {
      // update a result to status Deliverable
      const updateWithExternalId = {
        resultWorkflowStatusId: null,
        externalId: 'Deliverable',
      }

      // ensure we have a result in status "Deliverable"
      server
        .put(`${path}/workflow-status/${resultId}`)
        .send({
          resultWorkflowStatusId: null,
          externalId: 'Deliverable',
        })
        .set('Authorization', `Bearer${shared.token}`)
        .end(() => {
          // get first result in status "Deliverable"
          server
            .get(`${path}?workflowStatusId=7`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              resultId = res.body.data[0].id

              // set to true
              server
                .put(`${path}/qc-check/${resultId}`)
                .send({ qcCheck: true })
                .set('Authorization', `Bearer${shared.token}`)
                .end((err, res) => {
                  assert.equal(res.status, 200)
                  assert.typeOf(res.body, 'Object')
                  assert.property(res.body, 'data')
                  assert.typeOf(res.body.data, 'Object')
                  assert.typeOf(res.body.data.assay, 'Object')
                  assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
                  assert.typeOf(res.body.data.resultData, 'Object')
                  const resultFieldNames = [
                    'id',
                    'endedOn',
                    'deviceName',
                    'countryName',
                    'stateName',
                    'lgaName',
                    'resultCategory1Name',
                    'resultCategory2Name',
                    'resultData',
                    'sampleId',
                    'sampleGroup',
                    'patientId',
                    'siteName',
                    'assayVersion',
                    'consumableSerial',
                    'consumableLot',
                    'consumableExpirationDate',
                    'instrumentSerial',
                    'moduleName',
                    'moduleSerial',
                    'researchId',
                    'senderVersion',
                    'senderOperator',
                    'notes',
                    'errorCode',
                    'errorNotes',
                    'createdOn',
                    'updatedOn',
                    'assayId',
                    'assay',
                  ]
                  _.each(resultFieldNames, fieldName => {
                    assert.property(res.body.data, fieldName)
                  })

                  // check that flag was set to true
                  assert.equal(res.body.data.qcCheck, 1)

                  // ...and back to false
                  server
                    .put(`${path}/qc-check/${resultId}`)
                    .send({ qcCheck: false })
                    .set('Authorization', `Bearer${shared.token}`)
                    .end((err, res) => {
                      assert.equal(res.status, 200)
                      assert.typeOf(res.body, 'Object')
                      assert.property(res.body, 'data')
                      assert.typeOf(res.body.data, 'Object')
                      assert.typeOf(res.body.data.assay, 'Object')
                      assert.typeOf(
                        res.body.data.assay.resultDataSchema,
                        'Object'
                      )
                      assert.typeOf(res.body.data.resultData, 'Object')
                      const resultFieldNames = [
                        'id',
                        'endedOn',
                        'deviceName',
                        'countryName',
                        'stateName',
                        'lgaName',
                        'resultCategory1Name',
                        'resultCategory2Name',
                        'resultData',
                        'sampleId',
                        'sampleGroup',
                        'patientId',
                        'siteName',
                        'assayVersion',
                        'consumableSerial',
                        'consumableLot',
                        'consumableExpirationDate',
                        'instrumentSerial',
                        'moduleName',
                        'moduleSerial',
                        'researchId',
                        'senderVersion',
                        'senderOperator',
                        'notes',
                        'errorCode',
                        'errorNotes',
                        'createdOn',
                        'updatedOn',
                        'assayId',
                        'assay',
                      ]
                      _.each(resultFieldNames, fieldName => {
                        assert.property(res.body.data, fieldName)
                      })

                      // check that flag was set to false
                      assert.equal(res.body.data.qcCheck, 0)

                      // Clean Up: Update resultWorkflowStatus with original status
                      server
                        .put(`${path}/workflow-status/${resultId}`)
                        .send({
                          resultWorkflowStatusId: null,
                          externalId: initialResultWorkflowStatus,
                        })
                        .set('Authorization', `Bearer${shared.token}`)
                        .end((err, res) => {
                          assert.equal(
                            res.body.data.resultWorkflowStatus,
                            initialResultWorkflowStatus
                          )
                          done()
                        })
                    })
                })
            })
        })
    })
  })
})

describe('Result type routes', () => {
  const path = '/api/result/result-types'

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of result types when using valid token', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
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

describe('Result Workflow Status Log', () => {
  const resultId = 1
  const path = `/api/result/workflow-status-logs/${resultId}`

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of Result Workflow Status Logs (when using valid token)', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'changedOn')
          assert.property(res.body.data[0], 'statusName')
          assert.property(res.body.data[0], 'operator')
          assert.property(res.body, 'total')
          done()
        })
    })
  })
})
