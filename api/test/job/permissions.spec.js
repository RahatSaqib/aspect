const supertest = require('supertest')
const chai = require('chai')
// const _ = require('lodash')
// const dateFormat = require('date-fns/format')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

// const { getCommCarePayload } = require('../deviceApi/commcare/commcare_utils')
// const {
//   createTestContext,
//   getDeviceFromApiKey,
//   getLastResultId,
//   getLastResult,
// } = require('../deviceApi/utils')

describe.only('Permissions', () => {
  const countryAbbreviation = 'US'
  let countryId
  const partner1 = 1
  // const partner2 = 2
  // const jobFunctionId = {
  // }
  // let jobFunction1
  // let jobFunction2
  let jobFunctionId
  // let personId
  const personId = 1
  let cleanJob = false
  // let cleanJobContext = false
  let jobId
  let siteId
  // let person2

  // const userName = 'admin'

  // const path = '/api/job-function'
  // let resultId = 1
  // let assayId = 1
  // let initialResultWorkflowStatus = ''
  // let initialResultWorkflowStatusName = ''
  // const reason = 'testing'
  // const operator = 'Tester'
  // const changedOn = new Date(dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss.000Z'))

  before(async () =>
    runTestWithKnex(async knex => {
      const country = await knex('Country')
        .where('abbreviation', countryAbbreviation)
        .first('id')
      ;[{ id: countryId }] = [country]
      // console.log({ countryId, userName })
      ;[{ id: jobFunctionId }] = [
        await knex('JobFunction')
          .where({ partnerId: partner1 })
          .first(),
      ]
      // ;[{ id: jobFunction2 }] = [
      //   await knex('JobFunction')
      //     .where({ partnerId: partner2 })
      //     .first(),
      // ]

      // ;[{ id: personId }] = [
      //   await knex('Person as p')
      //     .join('User as u', 'p.userId', 'u.id')
      //     .where('u.name', userName)
      //     .first(),
      // ]

      //
      ;[{ id: siteId }] = [
        await knex('Site as s')
          .join('Geography as g', 's.geographyId', 'g.id')
          .where('g.countryId', countryId)
          .where('s.partnerId', partner1)
          .first('s.id'),
      ]

      // keep if items don't exist - then entries added during the test will be removed in after()
      const job = await knex('Job')
        .where({ personId, jobFunctionId })
        .first()
      cleanJob = !job // if Job doesn't exist then entry added during the test will be removed in after()

      // const jobContext = await knex('JobContext')
      //   .where({ personId, jobFunctionId })
      //   .first()
      // cleanJobContext = !jobContext

      // // country 'US' must have 2 persons defined before (check seeding scripts for details)
      // const persons = await knex('Person as p')
      //   .join('Geography as g', 'p.geographyId', 'g.id')
      //   .where({ countryId })
      //   .whereNull('g.stateId')
      //   .whereNull('g.lgaId')
      //   .select('id')
      // ;[{ id: person1 }, { id: person2 }] = persons
    })
  )
  after(async () =>
    runTestWithKnex(async knex => {
      if (cleanJob) {
        await knex('Job')
          .where('id', jobId)
          .del()
      }
    })
  )

  describe('Get permissions', () => {
    const path = `/api/job-function/permissions/${personId}/${partner1}`
    shared.checkToken(server, path)
    it('should return 200 and list of permissions for current person and partner', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 1)
          // check one permission
          const item = res.body.data.find(x => x === 'person:admin')
          assert.isString(item)
          //
          done()
        })
    })
  })

  describe('Job', () => {
    const path = '/api/job-function'

    it('should un-assign person from JobFunction and return list of remaining Jobs for person', done => {
      server
        .post(`${path}/unassign-job`)
        .send({
          personId,
          jobFunctionId,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          // list must NOT contain item we just removed
          const jf = res.body.data.find(
            x => x.personId === personId && x.jobFunctionId === jobFunctionId
          )
          assert.isUndefined(jf)
          //
          done()
        })
    })

    it('should assign person to JobFunction and return list of Jobs for person', done => {
      server
        .post(`${path}/assign-job`)
        .send({
          personId,
          jobFunctionId,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 1)
          let item = res.body.data[0]
          assert.property(item, 'id')
          assert.property(item, 'jobFunctionId')
          assert.property(item, 'personId')
          // list must contain item we just added
          item = res.body.data.find(
            x => x.personId === personId && x.jobFunctionId === jobFunctionId
          )
          assert.typeOf(item, 'Object')
          // get 'jobId' for use in next steps
          jobId = item.id
          assert.isNumber(jobId)
          //
          done()
        })
    })
  })

  describe('Job Context', () => {
    const path = '/api/job-function'
    let cleanJobContext = false
    //
    before(async () =>
      runTestWithKnex(async knex => {
        //
        const jobContext = await knex('JobContext')
          .where({ jobId, siteId })
          .whereNull('geographyId')
          .first()
        cleanJobContext = !jobContext
      })
    )
    //
    after(async () =>
      runTestWithKnex(async knex => {
        if (cleanJob || cleanJobContext) {
          await knex('JobContext')
            .where({ jobId, siteId })
            .whereNull('geographyId')
            .del()
        }
        if (cleanJob) {
          await knex('Job')
            .where('id', jobId)
            .del()
        }
      })
    )

    it('should un-assign person from JobContext and return list of remaining JobContexts for person', done => {
      server
        .post(`${path}/unassign-job-context`)
        .send({ jobId, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          // list must NOT contain item we just removed
          const item = res.body.data.find(
            x => x.jobId === jobId && x.siteId === siteId && !x.geographyId
          )
          assert.isUndefined(item)
          //
          done()
        })
    })

    it('should assign person to JobContext and return list of JobContexts for person', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ jobId, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 1)
          let item = res.body.data[0]
          // assert.property(item, 'id')
          assert.property(item, 'jobId')
          assert.property(item, 'geographyId')
          assert.property(item, 'siteId')
          assert.property(item, 'personId')
          assert.property(item, 'jobFunctionId')
          // list must contain item we just added
          item = res.body.data.find(
            x => x.jobId === jobId && x.siteId === siteId && !x.geographyId
          )
          assert.typeOf(item, 'Object')
          //
          done()
        })
    })
  })
})

//   describe('GET', () => {
//     shared.checkToken(server, path)

//     before(async () =>
//       runTestWithKnex(async knex => {
//         const country = await knex('Country')
//           .where('abbreviation', countryAbbreviation)
//           .first('id')
//         ;[{ id: countryId }] = [country]

//         //
//         const person = await knex('Person as p')
//           .join('Geography as g', 'p.geographyId', 'g.id')
//           .where({ countryId })
//           .whereNull('g.stateId')
//           .whereNull('g.lgaId')
//           .first('id')
//         ;[{ id: person1 }] = [person]
//       })
//     )
//     after(async () =>
//       runTestWithKnex(async knex => {
//         // await knex('ResultTreatmentStatusLog')
//         //   .where('resultId', resultId)
//         //   .delete()
//       })
//     )

//     it('should assign person to JobFunction and return a list of Jobs', () =>
//       runTestWithKnex(async knex => {
//         initialResultWorkflowStatusName = await server
//           .get(path)
//           .set('Authorization', `Bearer ${shared.token}`)
//           .then(res => {
//             assert.equal(res.status, 200)
//             assert.typeOf(res.body, 'Object')
//             assert.property(res.body, 'data')
//             assert.typeOf(res.body.data, 'array')
//             assert.isAtLeast(res.body.data.length, 5)
//             assert.property(res.body.data[0], 'id')
//             assert.property(res.body.data[0], 'endedOn')
//             assert.property(res.body.data[0], 'deviceName')
//             assert.property(res.body.data[0], 'sampleOriginSiteName')
//             assert.property(res.body.data[0], 'countryName')
//             assert.property(res.body.data[0], 'stateName')
//             assert.property(res.body.data[0], 'lgaName')
//             assert.property(res.body.data[0], 'sampleId')
//             assert.property(res.body.data[0], 'sampleGroup')
//             assert.property(res.body.data[0], 'resultText')
//             assert.property(res.body.data[0], 'resultWorkflowStatus')
//             assert.property(res.body.data[0], 'patientId')
//             assert.property(res.body.data[0], 'assayName')
//             assert.property(res.body, 'total')
//             ;[
//               {
//                 id: resultId,
//                 assayId,
//                 resultWorkflowStatus: initialResultWorkflowStatus,
//               },
//             ] = res.body.data
//             return res.body.data[0].resultWorkflowStatus
//           })

//         initialResultWorkflowStatus = (await knex
//           .from('ResultWorkflowStatus')
//           .where({ name: initialResultWorkflowStatusName })
//           .first('externalId')).externalId
//       }))

//     it('should return a list of results with assay-specific fields if TB assay is requested', done => {
//       server
//         .get(`${path}?assayId=${assayId}`)
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')
//           assert.property(res.body, 'data')
//           assert.typeOf(res.body.data, 'array')
//           assert.isAtLeast(res.body.data.length, 5)
//           assert.property(res.body.data[0], 'id')
//           assert.property(res.body.data[0], 'endedOn')
//           assert.property(res.body.data[0], 'deviceName')
//           assert.property(res.body.data[0], 'countryName')
//           assert.property(res.body.data[0], 'stateName')
//           assert.property(res.body.data[0], 'lgaName')
//           assert.property(res.body.data[0], 'sampleId')
//           assert.property(res.body.data[0], 'sampleGroup')
//           assert.property(res.body.data[0], 'patientId')
//           assert.property(res.body.data[0], 'assayName')
//           assert.property(res.body.data[0], 'resultCategory1Name')
//           assert.property(res.body.data[0], 'resultCategory2Name')
//           assert.property(res.body.data[0], 'resultText')
//           assert.property(res.body.data[0], 'resultWorkflowStatus')
//           assert.property(res.body, 'total')
//           assert.typeOf(res.body.extraColumns, 'array')
//           done()
//         })
//     })

//     it('should return a single result', done => {
//       server
//         .get(`${path}/${resultId}`)
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')
//           assert.property(res.body, 'data')
//           assert.typeOf(res.body.data, 'Object')
//           assert.property(res.body.data, 'id')
//           assert.property(res.body.data, 'endedOn')
//           assert.property(res.body.data, 'deviceName')
//           assert.property(res.body.data, 'countryName')
//           assert.property(res.body.data, 'stateName')
//           assert.property(res.body.data, 'lgaName')
//           assert.property(res.body.data, 'resultCategory1Name')
//           assert.property(res.body.data, 'resultCategory2Name')
//           assert.property(res.body.data, 'resultWorkflowStatusId')
//           assert.property(res.body.data, 'resultWorkflowStatus')
//           assert.property(res.body.data, 'resultWorkflowStatusExternalId')
//           assert.property(res.body.data, 'resultData')
//           assert.typeOf(res.body.data.resultData, 'Object')
//           assert.property(res.body.data, 'sampleId')
//           assert.property(res.body.data, 'sampleGroup')
//           assert.property(res.body.data, 'patientId')
//           assert.property(res.body.data, 'siteName')
//           assert.property(res.body.data, 'assayVersion')
//           assert.property(res.body.data, 'consumableSerial')
//           assert.property(res.body.data, 'consumableLot')
//           assert.property(res.body.data, 'consumableExpirationDate')
//           assert.property(res.body.data, 'instrumentSerial')
//           assert.property(res.body.data, 'moduleName')
//           assert.property(res.body.data, 'moduleSerial')
//           assert.property(res.body.data, 'researchId')
//           assert.property(res.body.data, 'senderVersion')
//           assert.property(res.body.data, 'senderOperator')
//           assert.property(res.body.data, 'notes')
//           assert.property(res.body.data, 'errorCode')
//           assert.property(res.body.data, 'errorNotes')
//           assert.property(res.body.data, 'qcCheck')
//           assert.property(res.body.data, 'createdOn')
//           assert.property(res.body.data, 'updatedOn')
//           assert.property(res.body.data, 'assayId')
//           assert.property(res.body.data, 'assay')
//           assert.typeOf(res.body.data.assay, 'Object')
//           assert.property(res.body.data.assay, 'id')
//           assert.property(res.body.data.assay, 'name')
//           assert.property(res.body.data.assay, 'i18nKey')
//           assert.property(res.body.data.assay, 'assayTypeId')
//           assert.property(res.body.data.assay, 'deviceTypeId')
//           assert.property(res.body.data.assay, 'resultCategory1Label')
//           assert.property(res.body.data.assay, 'resultCategory1i18nKey')
//           assert.property(res.body.data.assay, 'resultCategory2Label')
//           assert.property(res.body.data.assay, 'resultCategory2i18nKey')
//           assert.property(res.body.data.assay, 'resultDataSchema')
//           assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
//           assert.property(res.body.data, 'files')
//           done()
//         })
//     })
//   })

//   describe('PUT', () => {
//     after(async () =>
//       runTestWithKnex(async knex => {
//         await knex('ResultTreatmentStatusLog')
//           .where('resultId', resultId)
//           .delete()
//       })
//     )
//     it('Should update result status given a resultId', done => {
//       const updateWithExternalId = {
//         resultWorkflowStatusId: null,
//         externalId: 'Validated',
//         reason,
//         operator,
//         changedOn,
//       }
//       const updateWithId = {
//         resultWorkflowStatusId: 1,
//         externalId: null,
//       }

//       // update with external ID
//       server
//         .put(`${path}/workflow-status/${resultId}`)
//         .send(updateWithExternalId)
//         .set('Authorization', `Bearer${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')
//           assert.property(res.body, 'data')
//           assert.typeOf(res.body.data, 'Object')
//           assert.typeOf(res.body.data.assay, 'Object')
//           assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
//           assert.typeOf(res.body.data.resultData, 'Object')
//           const resultFieldNames = [
//             'id',
//             'endedOn',
//             'deviceName',
//             'countryName',
//             'stateName',
//             'lgaName',
//             'resultCategory1Name',
//             'resultCategory2Name',
//             'resultData',
//             'sampleId',
//             'sampleGroup',
//             'patientId',
//             'siteName',
//             'assayVersion',
//             'consumableSerial',
//             'consumableLot',
//             'consumableExpirationDate',
//             'instrumentSerial',
//             'moduleName',
//             'moduleSerial',
//             'researchId',
//             'senderVersion',
//             'senderOperator',
//             'notes',
//             'errorCode',
//             'errorNotes',
//             'createdOn',
//             'updatedOn',
//             'assayId',
//             'assay',
//             'resultWorkflowLogReason',
//             'resultWorkflowLogCreatedOn',
//             'resultWorkflowLogOperator',
//           ]
//           _.each(resultFieldNames, fieldName => {
//             assert.property(res.body.data, fieldName)
//           })
//           // check the updated fieldName
//           assert.equal(res.body.data.resultWorkflowStatus, 'Validated')
//           assert.equal(res.body.data.resultWorkflowLogReason, reason)
//           assert.equal(res.body.data.resultWorkflowLogOperator, operator)
//           assert.closeTo(
//             new Date(res.body.data.updatedOn).getTime(),
//             new Date().getTime(),
//             5000
//           )
//           assert.equal(
//             dateFormat(
//               res.body.data.resultWorkflowLogChangedOn,
//               'yyyy-MM-dd HH:mm:ss'
//             ),
//             dateFormat(changedOn, 'yyyy-MM-dd HH:mm:ss')
//           )

//           // update with resultWorkflowStatusId
//           server
//             .put(`${path}/workflow-status/${resultId}`)
//             .send(updateWithId)
//             .set('Authorization', `Bearer${shared.token}`)
//             .end((err, res) => {
//               assert.equal(res.status, 200)
//               assert.typeOf(res.body, 'Object')
//               assert.property(res.body, 'data')
//               assert.typeOf(res.body.data, 'Object')
//               assert.typeOf(res.body.data.assay, 'Object')
//               assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
//               assert.typeOf(res.body.data.resultData, 'Object')
//               const resultFieldNames = [
//                 'id',
//                 'endedOn',
//                 'deviceName',
//                 'countryName',
//                 'stateName',
//                 'lgaName',
//                 'resultCategory1Name',
//                 'resultCategory2Name',
//                 'resultData',
//                 'sampleId',
//                 'sampleGroup',
//                 'patientId',
//                 'siteName',
//                 'assayVersion',
//                 'consumableSerial',
//                 'consumableLot',
//                 'consumableExpirationDate',
//                 'instrumentSerial',
//                 'moduleName',
//                 'moduleSerial',
//                 'researchId',
//                 'senderVersion',
//                 'senderOperator',
//                 'notes',
//                 'errorCode',
//                 'errorNotes',
//                 'createdOn',
//                 'updatedOn',
//                 'assayId',
//                 'assay',
//               ]
//               _.each(resultFieldNames, fieldName => {
//                 assert.property(res.body.data, fieldName)
//               })

//               // check if resultWorkflowStatus was updated
//               assert.equal(res.body.data.resultWorkflowStatus, 'OK')

//               // Check if update persisted
//               server
//                 .get(`/api/result/${resultId}`)
//                 .set('Authorization', `Bearer${shared.token}`)
//                 .end((err, res) => {
//                   assert.equal(res.body.data.resultWorkflowStatus, 'OK')

//                   // Clean Up: Update resultWorkflowStatus with original status
//                   server
//                     .put(`${path}/workflow-status/${resultId}`)
//                     .send({
//                       resultWorkflowStatusId: null,
//                       externalId: initialResultWorkflowStatus,
//                     })
//                     .set('Authorization', `Bearer${shared.token}`)
//                     .end((err, res) => {
//                       assert.equal(
//                         res.body.data.resultWorkflowStatus,
//                         initialResultWorkflowStatusName
//                       )
//                       done()
//                     })
//                 })
//             })
//         })
//     })

//     // ------------------------------------------------------------------------
//     // helper function
//     const baseTreatmentStatusAssertion = res => {
//       assert.equal(res.status, 200)
//       assert.typeOf(res.body, 'Object')
//       assert.property(res.body, 'data')
//       assert.typeOf(res.body.data, 'Object')
//       assert.typeOf(res.body.data.assay, 'Object')
//       assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
//       assert.typeOf(res.body.data.resultData, 'Object')
//       const resultFieldNames = [
//         'id',
//         'endedOn',
//         'deviceName',
//         'countryName',
//         'stateName',
//         'lgaName',
//         'resultCategory1Name',
//         'resultCategory2Name',
//         'resultData',
//         'sampleId',
//         'sampleGroup',
//         'patientId',
//         'siteName',
//         'assayVersion',
//         'consumableSerial',
//         'consumableLot',
//         'consumableExpirationDate',
//         'instrumentSerial',
//         'moduleName',
//         'moduleSerial',
//         'researchId',
//         'senderVersion',
//         'senderOperator',
//         'notes',
//         'errorCode',
//         'errorNotes',
//         'createdOn',
//         'updatedOn',
//         'assayId',
//         'assay',
//       ]
//       _.each(resultFieldNames, fieldName => {
//         assert.property(res.body.data, fieldName)
//       })
//     }

//     it('Should update result treatment status given a resultId - with externalId', done => {
//       const changedOn = '2019-03-25T10:00:33.000Z'
//       const updateWithExternalId = {
//         externalId: 'AwaitingTreatment',
//         data: 'should be treated',
//         method: 'sms',
//         changedOn,
//       }
//       // update with external ID
//       server
//         .put(`${path}/treatment-status/${resultId}`)
//         .send(updateWithExternalId)
//         .set('Authorization', `Bearer${shared.token}`)
//         .end((err, res) => {
//           baseTreatmentStatusAssertion(res)

//           const { treatmentStatus } = res.body.data
//           // check the updated fieldName
//           assert.equal(treatmentStatus.externalId, 'AwaitingTreatment')
//           assert.equal(treatmentStatus.changedOn, changedOn)

//           done()
//         })
//     })
//     it('Should update result treatment status given a resultId - with resultTreatmentStatusId', done => {
//       const changedOn = '2019-03-26T10:00:33.000Z'
//       const updateWithId = {
//         resultTreatmentStatusId: 2,
//         data: 'should be treated',
//         method: 'sms',
//         changedOn,
//       }
//       // update with resultTreatmentStatusId
//       server
//         .put(`${path}/treatment-status/${resultId}`)
//         .send(updateWithId)
//         .set('Authorization', `Bearer${shared.token}`)
//         .end((err, res) => {
//           baseTreatmentStatusAssertion(res)

//           const { treatmentStatus } = res.body.data
//           // check if resultWorkflowStatus was updated
//           assert.equal(treatmentStatus.externalId, 'OnTreatment')
//           assert.equal(treatmentStatus.changedOn, changedOn)

//           done()
//         })
//     })
//     it('Should update result treatment status given a resultId - set to null', done => {
//       const changedOn = '2019-03-27T10:00:33.000Z'
//       const updateWithNull = {
//         resultTreatmentStatusId: null,
//         data: 'should be treated',
//         method: 'sms',
//         changedOn,
//       }
//       // set to null
//       server
//         .put(`${path}/treatment-status/${resultId}`)
//         .send(updateWithNull)
//         .set('Authorization', `Bearer${shared.token}`)
//         .end((err, res) => {
//           baseTreatmentStatusAssertion(res)

//           assert.isUndefined(res.body.data.treatmentStatus)

//           done()
//         })
//     })

//     it('Updating "QC Check" should fail if not in status "Deliverable"', done => {
//       // try settings
//       server
//         .put(`${path}/workflow-status/${resultId}`)
//         .send({
//           resultWorkflowStatusId: null,
//           externalId: 'Validated',
//           changedOn: new Date(),
//         })
//         .set('Authorization', `Bearer${shared.token}`)
//         .end(() => {
//           server
//             .put(`${path}/qc-check/${resultId}`)
//             .send({ qcCheck: true })
//             .set('Authorization', `Bearer${shared.token}`)
//             .end((err, res) => {
//               assert.equal(res.status, 400)
//               done()
//             })
//         })
//     })

//     it('Should update "QC Check" given a resultId and boolean if in status "Deliverable"', done => {
//       // ensure we have a result in status "Deliverable"
//       server
//         .put(`${path}/workflow-status/${resultId}`)
//         .send({
//           resultWorkflowStatusId: null,
//           externalId: 'Deliverable',
//           changedOn: new Date(),
//         })
//         .set('Authorization', `Bearer${shared.token}`)
//         .end(() => {
//           // get first result in status "Deliverable"
//           server
//             .get(`${path}?workflowStatusId=7`)
//             .set('Authorization', `Bearer ${shared.token}`)
//             .end((err, res) => {
//               resultId = res.body.data[0].id

//               // set to true
//               server
//                 .put(`${path}/qc-check/${resultId}`)
//                 .send({ qcCheck: true })
//                 .set('Authorization', `Bearer${shared.token}`)
//                 .end((err, res) => {
//                   assert.equal(res.status, 200)
//                   assert.typeOf(res.body, 'Object')
//                   assert.property(res.body, 'data')
//                   assert.typeOf(res.body.data, 'Object')
//                   assert.typeOf(res.body.data.assay, 'Object')
//                   assert.typeOf(res.body.data.assay.resultDataSchema, 'Object')
//                   assert.typeOf(res.body.data.resultData, 'Object')
//                   const resultFieldNames = [
//                     'id',
//                     'endedOn',
//                     'deviceName',
//                     'countryName',
//                     'stateName',
//                     'lgaName',
//                     'resultCategory1Name',
//                     'resultCategory2Name',
//                     'resultData',
//                     'sampleId',
//                     'sampleGroup',
//                     'patientId',
//                     'siteName',
//                     'assayVersion',
//                     'consumableSerial',
//                     'consumableLot',
//                     'consumableExpirationDate',
//                     'instrumentSerial',
//                     'moduleName',
//                     'moduleSerial',
//                     'researchId',
//                     'senderVersion',
//                     'senderOperator',
//                     'notes',
//                     'errorCode',
//                     'errorNotes',
//                     'createdOn',
//                     'updatedOn',
//                     'assayId',
//                     'assay',
//                   ]
//                   _.each(resultFieldNames, fieldName => {
//                     assert.property(res.body.data, fieldName)
//                   })

//                   // check that flag was set to true
//                   assert.equal(res.body.data.qcCheck, 1)

//                   // ...and back to false
//                   server
//                     .put(`${path}/qc-check/${resultId}`)
//                     .send({ qcCheck: false })
//                     .set('Authorization', `Bearer${shared.token}`)
//                     .end((err, res) => {
//                       assert.equal(res.status, 200)
//                       assert.typeOf(res.body, 'Object')
//                       assert.property(res.body, 'data')
//                       assert.typeOf(res.body.data, 'Object')
//                       assert.typeOf(res.body.data.assay, 'Object')
//                       assert.typeOf(
//                         res.body.data.assay.resultDataSchema,
//                         'Object'
//                       )
//                       assert.typeOf(res.body.data.resultData, 'Object')
//                       const resultFieldNames = [
//                         'id',
//                         'endedOn',
//                         'deviceName',
//                         'countryName',
//                         'stateName',
//                         'lgaName',
//                         'resultCategory1Name',
//                         'resultCategory2Name',
//                         'resultData',
//                         'sampleId',
//                         'sampleGroup',
//                         'patientId',
//                         'siteName',
//                         'assayVersion',
//                         'consumableSerial',
//                         'consumableLot',
//                         'consumableExpirationDate',
//                         'instrumentSerial',
//                         'moduleName',
//                         'moduleSerial',
//                         'researchId',
//                         'senderVersion',
//                         'senderOperator',
//                         'notes',
//                         'errorCode',
//                         'errorNotes',
//                         'createdOn',
//                         'updatedOn',
//                         'assayId',
//                         'assay',
//                       ]
//                       _.each(resultFieldNames, fieldName => {
//                         assert.property(res.body.data, fieldName)
//                       })

//                       // check that flag was set to false
//                       assert.equal(res.body.data.qcCheck, 0)

//                       // Clean Up: Update resultWorkflowStatus with original status
//                       server
//                         .put(`${path}/workflow-status/${resultId}`)
//                         .send({
//                           resultWorkflowStatusId: null,
//                           externalId: initialResultWorkflowStatus,
//                         })
//                         .set('Authorization', `Bearer${shared.token}`)
//                         .end((err, res) => {
//                           assert.equal(
//                             res.body.data.resultWorkflowStatusExternalId,
//                             initialResultWorkflowStatus
//                           )
//                           done()
//                         })
//                     })
//                 })
//             })
//         })
//     })

//     describe('Form data', () => {
//       const context = createTestContext(server, {
//         user: 'gates_rdt',
//         password: 'gates2018',
//         type: 'CommCareApp',
//         partner: 'GatesRDT',
//         site: 'commcare',
//       })
//       const { runTest } = context
//       let resultId
//       let result
//       let apiKey

//       beforeEach(async () => {
//         const commcarePluginPath = '/device/plugin/commcare'
//         await context.createSites(['commcare'])
//         await context.createDeviceApiKey()

//         return runTest(async knex => {
//           apiKey = context.apiKey // eslint-disable-line prefer-destructuring
//           await server
//             .post(commcarePluginPath)
//             .auth('commcare_test', apiKey.token)
//             .send(
//               getCommCarePayload({
//                 resultText: 'negative',
//                 age: 28,
//                 gender: 'male',
//               })
//             )
//             .then(res => {
//               assert.equal(res.status, 200)
//               assert.typeOf(res.body, 'Object')
//             })
//           const device = await getDeviceFromApiKey(knex, apiKey)
//           resultId = await getLastResultId(knex, device.id)
//           result = await getLastResult(knex, device.id)
//           assert.isNull(result.formData)
//         })
//       })

//       afterEach(context.afterEach)

//       it('Should save values to the formData field in the result', async () =>
//         runTestWithKnex(async knex => {
//           let response = await server
//             .put(`${path}/form-data/${resultId}`)
//             .send({
//               expertInterpretation: 'positive',
//             })
//             .set('Authorization', context.clientAuth)
//           assert.deepEqual(response.body.data.formData, {
//             expertInterpretation: 'positive',
//           })
//           assert.equal(response.body.data.id, resultId)
//           let resultFromDatabase = await knex('Result')
//             .where('id', resultId)
//             .first('formData')
//           assert.deepEqual(
//             response.body.data.formData,
//             JSON.parse(resultFromDatabase.formData)
//           )

//           response = await server
//             .put(`${path}/form-data/${resultId}`)
//             .send({
//               expertInterpretation: null,
//             })
//             .set('Authorization', context.clientAuth)
//           assert.deepEqual(response.body.data.formData, {
//             expertInterpretation: null,
//           })
//           assert.equal(response.body.data.id, resultId)
//           resultFromDatabase = await knex('Result')
//             .where('id', resultId)
//             .first('formData')
//           assert.deepEqual(
//             response.body.data.formData,
//             JSON.parse(resultFromDatabase.formData)
//           )

//           response = await server
//             .put(`${path}/form-data/${resultId}`)
//             .send({
//               expertInterpretation: 'negative',
//             })
//             .set('Authorization', context.clientAuth)
//           assert.deepEqual(response.body.data.formData, {
//             expertInterpretation: 'negative',
//           })
//           assert.equal(response.body.data.id, resultId)
//           resultFromDatabase = await knex('Result')
//             .where('id', resultId)
//             .first('formData')
//           assert.deepEqual(
//             response.body.data.formData,
//             JSON.parse(resultFromDatabase.formData)
//           )

//           response = await server
//             .put(`${path}/form-data/${resultId}`)
//             .send({})
//             .set('Authorization', context.clientAuth)
//           assert.deepEqual(response.body.data.formData, {
//             expertInterpretation: 'negative',
//           })
//           assert.equal(response.body.data.id, resultId)
//           resultFromDatabase = await knex('Result')
//             .where('id', resultId)
//             .first('formData')
//           assert.deepEqual(
//             response.body.data.formData,
//             JSON.parse(resultFromDatabase.formData)
//           )
//         }))

//       it("Should NOT save values to the formData field in the result when field sent is not in the assay's form schema", async () =>
//         runTestWithKnex(async knex => {
//           const response = await server
//             .put(`${path}/form-data/${resultId}`)
//             .send({
//               someUndefinedField: 'positive',
//               anotherUndefinedField: 'another value',
//             })
//             .set('Authorization', context.clientAuth)
//           assert.equal(response.statusCode, 400)
//           const resultFromDatabase = await knex('Result')
//             .where('id', resultId)
//             .first('formData')
//           assert.isNull(resultFromDatabase.formData)
//         }))

//       it("Should NOT save values to the formData field in the result when value is not in the selector field's options list", async () =>
//         runTestWithKnex(async knex => {
//           const response = await server
//             .put(`${path}/form-data/${resultId}`)
//             .send({
//               expertInterpretation: 'unknown option',
//             })
//             .set('Authorization', context.clientAuth)
//           assert.equal(response.statusCode, 400)
//           const resultFromDatabase = await knex('Result')
//             .where('id', resultId)
//             .first('formData')
//           assert.isNull(resultFromDatabase.formData)
//         }))
//     })
//   })
// })

// describe('Result type routes', () => {
//   const path = '/api/result/result-types'

//   describe('GET', () => {
//     shared.checkToken(server, path)

//     it('should return a list of result types when using valid token', done => {
//       server
//         .get(path)
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')
//           assert.property(res.body, 'data')
//           assert.typeOf(res.body.data, 'array')
//           assert.isAtLeast(res.body.data.length, 5)
//           assert.property(res.body.data[0], 'id')
//           assert.property(res.body.data[0], 'name')
//           assert.property(res.body, 'total')
//           done()
//         })
//     })
//   })
// })

// describe('Result Workflow Status Log', () => {
//   const resultId = 1
//   const path = `/api/result/workflow-status-logs/${resultId}`

//   describe('GET', () => {
//     shared.checkToken(server, path)

//     it('should return a list of Result Workflow Status Logs (when using valid token)', done => {
//       server
//         .get(path)
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')
//           assert.property(res.body, 'data')
//           assert.typeOf(res.body.data, 'array')
//           assert.isAtLeast(res.body.data.length, 2)
//           assert.property(res.body.data[0], 'id')
//           assert.property(res.body.data[0], 'changedOn')
//           assert.property(res.body.data[0], 'statusName')
//           assert.property(res.body.data[0], 'operator')
//           assert.property(res.body, 'total')
//           done()
//         })
//     })
//   })
// })

// describe('Result download routes', () => {
//   const path = '/api/result/download'
//   describe('GET', () => {
//     shared.checkToken(server, path)

//     it('should return a paged list of results, including all result details', done => {
//       server
//         .get(`${path}?size=1&deviceType=DaktariVirology`)
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')

//           assert.property(res.body, 'ok')
//           assert.property(res.body, 'total')
//           assert.property(res.body, 'length')
//           assert.property(res.body, 'data')

//           assert.equal(res.body.ok, true)
//           assert.isAtLeast(res.body.total, 2)
//           assert.equal(res.body.length, 1)

//           assert.typeOf(res.body.data, 'array')
//           assert.equal(res.body.data.length, 1)

//           assert.property(res.body.data[0], 'id')
//           assert.property(res.body.data[0], 'externalId')
//           assert.property(res.body.data[0], 'startedOn')
//           assert.property(res.body.data[0], 'endedOn')
//           assert.property(res.body.data[0], 'createdOn')
//           assert.property(res.body.data[0], 'updatedOn')
//           assert.property(res.body.data[0], 'longitude')
//           assert.property(res.body.data[0], 'latitude')
//           assert.property(res.body.data[0], 'assayExternalId')
//           assert.property(res.body.data[0], 'siteName')
//           assert.property(res.body.data[0], 'deviceName')
//           assert.property(res.body.data[0], 'resultCategory1ExternalId')
//           assert.property(res.body.data[0], 'resultCategory2ExternalId')
//           assert.property(res.body.data[0], 'workflowStatus')
//           assert.property(res.body.data[0], 'treatmentStatus')
//           assert.property(res.body.data[0], 'patientData')
//           assert.property(res.body.data[0], 'resultData')
//           assert.property(res.body.data[0], 'formData')
//           assert.property(res.body.data[0], 'researchId')
//           assert.property(res.body.data[0], 'senderVersion')
//           assert.property(res.body.data[0], 'senderOperator')
//           assert.property(res.body.data[0], 'notes')
//           assert.property(res.body.data[0], 'errorCode')
//           assert.property(res.body.data[0], 'errorNotes')
//           assert.property(res.body.data[0], 'sample')

//           assert.equal(Object.keys(res.body.data[0]).length, 25)

//           done()
//         })
//     })

//     it('should test querying different results with different optional parameters', done => {
//       const resultCategories = ['Detected', 'Invalid', 'Error']
//       server
//         .get(
//           `${path}?size=1&deviceType=DaktariVirology&resultCategories=${resultCategories.join(
//             ','
//           )}`
//         )
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')

//           assert.property(res.body, 'ok')
//           assert.property(res.body, 'total')
//           assert.property(res.body, 'length')
//           assert.property(res.body, 'data')

//           assert.equal(res.body.ok, true)
//           assert.isAtLeast(res.body.total, 1)
//           assert.equal(res.body.length, 1)

//           assert.typeOf(res.body.data, 'array')
//           assert.equal(res.body.data.length, 1)

//           assert.property(res.body.data[0], 'id')
//           assert.property(res.body.data[0], 'externalId')
//           assert.property(res.body.data[0], 'startedOn')
//           assert.property(res.body.data[0], 'endedOn')
//           assert.property(res.body.data[0], 'createdOn')
//           assert.property(res.body.data[0], 'updatedOn')
//           assert.property(res.body.data[0], 'longitude')
//           assert.property(res.body.data[0], 'latitude')
//           assert.property(res.body.data[0], 'assayExternalId')
//           assert.property(res.body.data[0], 'siteName')
//           assert.property(res.body.data[0], 'deviceName')
//           assert.property(res.body.data[0], 'resultCategory1ExternalId')
//           assert.property(res.body.data[0], 'resultCategory2ExternalId')
//           assert.property(res.body.data[0], 'workflowStatus')
//           assert.property(res.body.data[0], 'treatmentStatus')
//           assert.property(res.body.data[0], 'patientData')
//           assert.property(res.body.data[0], 'resultData')
//           assert.property(res.body.data[0], 'formData')
//           assert.property(res.body.data[0], 'researchId')
//           assert.property(res.body.data[0], 'senderVersion')
//           assert.property(res.body.data[0], 'senderOperator')
//           assert.property(res.body.data[0], 'notes')
//           assert.property(res.body.data[0], 'errorCode')
//           assert.property(res.body.data[0], 'errorNotes')
//           assert.property(res.body.data[0], 'sample')

//           assert.equal(Object.keys(res.body.data[0]).length, 25)
//         })

//       server
//         .get(
//           `${path}?size=1&deviceType=DaktariVirology&assayTypeAbbreviations=HCV,Ebola,HIV`
//         )
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')

//           assert.property(res.body, 'ok')
//           assert.property(res.body, 'total')
//           assert.property(res.body, 'length')
//           assert.property(res.body, 'data')
//           assert.equal(res.body.ok, true)
//           assert.isAtLeast(res.body.total, 2)
//           assert.equal(res.body.length, 1)

//           assert.typeOf(res.body.data, 'array')
//           assert.equal(res.body.data.length, 1)

//           assert.property(res.body.data[0], 'id')
//           assert.property(res.body.data[0], 'externalId')
//           assert.property(res.body.data[0], 'startedOn')
//           assert.property(res.body.data[0], 'endedOn')
//           assert.property(res.body.data[0], 'createdOn')
//           assert.property(res.body.data[0], 'updatedOn')
//           assert.property(res.body.data[0], 'longitude')
//           assert.property(res.body.data[0], 'latitude')
//           assert.property(res.body.data[0], 'assayExternalId')
//           assert.property(res.body.data[0], 'siteName')
//           assert.property(res.body.data[0], 'deviceName')
//           assert.property(res.body.data[0], 'resultCategory1ExternalId')
//           assert.property(res.body.data[0], 'resultCategory2ExternalId')
//           assert.property(res.body.data[0], 'workflowStatus')
//           assert.property(res.body.data[0], 'treatmentStatus')
//           assert.property(res.body.data[0], 'patientData')
//           assert.property(res.body.data[0], 'resultData')
//           assert.property(res.body.data[0], 'formData')
//           assert.property(res.body.data[0], 'researchId')
//           assert.property(res.body.data[0], 'senderVersion')
//           assert.property(res.body.data[0], 'senderOperator')
//           assert.property(res.body.data[0], 'notes')
//           assert.property(res.body.data[0], 'errorCode')
//           assert.property(res.body.data[0], 'errorNotes')
//           assert.property(res.body.data[0], 'sample')
//         })
//       server
//         .get(`${path}?size=1&workflowStatus=OK`)
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')

//           assert.property(res.body, 'ok')
//           assert.property(res.body, 'total')
//           assert.property(res.body, 'length')
//           assert.property(res.body, 'data')

//           assert.equal(res.body.ok, true)
//           assert.isAtLeast(res.body.total, 0)
//           assert.equal(res.body.length, 0)

//           assert.typeOf(res.body.data, 'array')
//           assert.equal(res.body.data.length, 0)
//         })
//       server
//         .get(`${path}?size=1&treatmentStatus=OnTreatment`)
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')
//           assert.property(res.body, 'ok')
//           assert.property(res.body, 'total')
//           assert.property(res.body, 'length')
//           assert.property(res.body, 'data')

//           assert.equal(res.body.ok, true)
//           assert.isAtLeast(res.body.total, 0)
//           assert.equal(res.body.length, 0)

//           assert.typeOf(res.body.data, 'array')
//           assert.equal(res.body.data.length, 0)
//         })
//       server
//         .get(`${path}?size=1&patientSample=-&deviceType=DaktariVirology`)
//         .set('Authorization', `Bearer ${shared.token}`)
//         .end((err, res) => {
//           assert.equal(res.status, 200)
//           assert.typeOf(res.body, 'Object')

//           assert.property(res.body, 'ok')
//           assert.property(res.body, 'total')
//           assert.property(res.body, 'length')
//           assert.property(res.body, 'data')

//           assert.equal(res.body.ok, true)
//           assert.isAtLeast(res.body.total, 1)
//           assert.equal(res.body.length, 1)

//           assert.typeOf(res.body.data, 'array')
//           assert.equal(res.body.data.length, 1)

//           assert.property(res.body.data[0], 'id')
//           assert.property(res.body.data[0], 'externalId')
//           assert.property(res.body.data[0], 'startedOn')
//           assert.property(res.body.data[0], 'endedOn')
//           assert.property(res.body.data[0], 'createdOn')
//           assert.property(res.body.data[0], 'updatedOn')
//           assert.property(res.body.data[0], 'longitude')
//           assert.property(res.body.data[0], 'latitude')
//           assert.property(res.body.data[0], 'assayExternalId')
//           assert.property(res.body.data[0], 'siteName')
//           assert.property(res.body.data[0], 'deviceName')
//           assert.property(res.body.data[0], 'resultCategory1ExternalId')
//           assert.property(res.body.data[0], 'resultCategory2ExternalId')
//           assert.property(res.body.data[0], 'workflowStatus')
//           assert.property(res.body.data[0], 'treatmentStatus')
//           assert.property(res.body.data[0], 'patientData')
//           assert.property(res.body.data[0], 'resultData')
//           assert.property(res.body.data[0], 'formData')
//           assert.property(res.body.data[0], 'researchId')
//           assert.property(res.body.data[0], 'senderVersion')
//           assert.property(res.body.data[0], 'senderOperator')
//           assert.property(res.body.data[0], 'notes')
//           assert.property(res.body.data[0], 'errorCode')
//           assert.property(res.body.data[0], 'errorNotes')
//           assert.property(res.body.data[0], 'sample')

//           done()
//         })
//     })
//   })
