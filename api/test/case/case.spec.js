const supertest = require('supertest')
const _ = require('lodash')
const { assert } = require('chai')
const {
  getFirstCase,
  getFirstPartnerId,
  getFirstDiseaseId,
} = require('./utils')
const { knex } = require('../../src/db')
const { getAdminId } = require('../utils/authUtils')
const { getAccessToken } = require('../utils/authUtils')
const {
  addCase,
  getCaseId,
  removeCase,
  updateCase,
  onResultLogged,
} = require('../../src/case/service')
const { createMessageContext, waitForAction } = require('../utils/mqUtils')
const { caseAdded, caseUpdated } = require('../../src/case/actions')
const { diseaseToId } = require('../../src/shared/dictionary')
const { createResult } = require('../result/result_utils')

const server = supertest.agent('http://localhost:8080')

function assertPropsOnList(res) {
  assert.property(res.body.data[0], 'id')
  assert.property(res.body.data[0], 'externalId')
  assert.property(res.body.data[0], 'sampleOriginSite')
  assert.property(res.body.data[0], 'diseaseName')
  assert.property(res.body.data[0], 'diseaseId')
  assert.property(res.body.data[0], 'diseaseExternalId')
  assert.property(res.body.data[0], 'status')
  assert.property(res.body.data[0], 'patientId')
  assert.property(res.body.data[0], 'createdBy')
  assert.property(res.body.data[0], 'updatedBy')
  assert.property(res.body.data[0], 'createdOn')
  assert.property(res.body.data[0], 'updatedOn')
}

describe('case/service', () => {
  let partnerId = null
  let diseaseId = null
  let accessToken = null
  let adminId = null
  const path = '/api/case'
  let messageContext

  // helpers
  const getExternalId = () =>
    `${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const mockCase = externalId => {
    return {
      createdBy: adminId,
      updatedBy: adminId,
      externalId,
      diseaseId,
      partnerId,
    }
  }

  before(async () => {
    partnerId = await getFirstPartnerId()
    diseaseId = await getFirstDiseaseId(partnerId)
    accessToken = await getAccessToken('admin', 'test07')
    adminId = await getAdminId()

    messageContext = await createMessageContext()
    messageContext.bindActionCreators({ caseAdded, caseUpdated })
  })

  describe('GET', () => {
    let caseToTest = null

    it('Should return a list of cases', async () => {
      const res = await server
        .get(path)
        .set('Authorization', `Bearer ${accessToken}`)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isNotNull(res.body.data)
      assert.isAtLeast(res.body.data.length, 1)
      assertPropsOnList(res)
      ;[caseToTest] = res.body.data
    })

    it('Should return a list of cases filtered by patientOrCaseId', async () => {
      const res = await server
        .get(`${path}?patientOrCaseId=${caseToTest.patientId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isNotNull(res.body.data)
      assert.isAtLeast(res.body.data.length, 1)
      assertPropsOnList(res)
      assert.equal(res.body.data[0].id, caseToTest.id)
    })

    it('Should return a list of cases filtered by diseaseId', async () => {
      const res = await server
        .get(`${path}?diseaseId=${diseaseId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isNotNull(res.body.data)
      assert.isAtLeast(res.body.data.length, 1)
      assertPropsOnList(res)
    })

    it('Should return an empty list', async () => {
      const unexistentClinicId = _.random(1000000, 9999999)

      const res = await server
        .get(`${path}?sampleOriginSite=${unexistentClinicId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isNotNull(res.body.data)
      assert.equal(res.body.data.length, 0)
    })

    it('Should return auto-complete cases ', async () => {
      const externalId = 'case-'
      const res = await server
        .get(`${path}/auto`)
        .query({
          externalId,
        })
        .set('Authorization', `Bearer ${accessToken}`)

      const [quantity] = await knex('PatientCase as ca')
        .innerJoin('Result as r', 'ca.id', 'r.patientCaseId')
        .innerJoin('Geography as g', 'r.geographyId', 'g.id')
        .where('ca.externalId', 'like', `%${externalId}%`)
        .count()

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isNotNull(res.body.data)
      assert.equal(res.body.data.length, quantity['count(*)'])
      assert.property(res.body.data[0], 'id')
      assert.property(res.body.data[0], 'externalId')
    })
  })

  // TODO: Convert all the tests below into unit tests
  describe('add / update', () => {
    let caseId
    it('Should add case and return the id', async () => {
      const objCase = mockCase(`Some externalId ${getExternalId()}`)

      caseId = await addCase(objCase, { messageContext })
      assert.isNotNull(caseId)

      // check that MQ handled action with actual values
      const waitForCaseAdded = waitForAction(caseAdded(caseId))
      await waitForCaseAdded
    })

    it('Should update case and handle MQ message', async () => {
      const caseIds = await updateCase(
        { id: caseId },
        { externalId: `Changed externalId ${getExternalId()}` },
        { messageContext }
      )
      assert.isNotNull(caseIds)
      assert.isArray(caseIds)
      assert.isNotEmpty(caseIds)

      await Promise.all(
        caseIds.map(caseId => waitForAction(caseUpdated(caseId)))
      )
    })
  })

  describe('remove', () => {
    it('Should remove case', async () => {
      const objCase = mockCase(
        `non existent externalId ${Math.floor(Math.random() * 10000)}`
      )

      await addCase(objCase)
      await removeCase(objCase)
      const caseId = await getCaseId(objCase)
      assert.isNull(caseId)
    })
  })

  describe('getCaseId', () => {
    it('Providing an existent externalId and partnerId, should return the id of the case', async () => {
      const existentCase = await getFirstCase()
      const caseId = await getCaseId({
        externalId: existentCase.externalId,
        partnerId: existentCase.partnerId,
        diseaseId: existentCase.diseaseId,
      })
      assert.equal(caseId, existentCase.id)
    })

    it("Providing a non existent externalId, partnerId and allowing create it, should create a new case and return it's id", async () => {
      const createIfNonExistent = true
      const objCase = mockCase(
        `non existent externalId ${Math.floor(Math.random() * 10000)}`
      )

      const caseId = await getCaseId(objCase, createIfNonExistent, adminId)
      await removeCase(objCase)
      assert.isNotNull(caseId)
    })

    it("Providing a non existent externalId, partnerId and not allowing create it, shouldn't create a new case and return null", async () => {
      const createIfNonExistent = false

      const objCase = mockCase(
        `non existent externalId ${Math.floor(Math.random() * 10000)}`
      )

      const caseId = await getCaseId(objCase, createIfNonExistent)
      assert.isNull(caseId)
    })
  })

  describe('onResultLogged', () => {
    let partnerId
    let otherUserId
    let latestCaseIdBeforeTests
    let latestResultIdBeforeTests
    let latestSampleIdBeforeTests
    let latestDeviceIdBeforeTests
    let latestSiteIdBeforeTests

    before(async () => {
      ;({ id: latestSampleIdBeforeTests } = await knex('Sample')
        .max('id as id')
        .first())
      ;({ id: latestResultIdBeforeTests } = await knex('Result')
        .max('id as id')
        .first())
      ;({ id: latestCaseIdBeforeTests } = await knex('PatientCase')
        .max('id as id')
        .first())
      ;({ id: latestDeviceIdBeforeTests } = await knex('Device')
        .max('id as id')
        .first())
      ;({ id: latestSiteIdBeforeTests } = await knex('Site')
        .max('id as id')
        .first())

      partnerId = (
        await knex('Partner').where('name', 'Partner One').first('id')
      ).id
      adminId = await getAdminId()
      otherUserId = (
        await knex('User').where('name', '<>', 'admin').first('id')
      ).id
    })

    after(async () => {
      await knex('Result').where('id', '>', latestResultIdBeforeTests).del()
      await knex('Sample').where('id', '>', latestSampleIdBeforeTests).del()
      await knex('PatientCase').where('id', '>', latestCaseIdBeforeTests).del()
      await knex('DeviceLog')
        .where('deviceId', '>', latestDeviceIdBeforeTests)
        .del()
      await knex('Device').where('id', '>', latestDeviceIdBeforeTests).del()
      await knex('Site').where('id', '>', latestSiteIdBeforeTests).del()
    })

    function mockMessageContext() {
      return {
        messageContext: {
          run: async callback => callback(knex),
        },
      }
    }

    async function getLastCaseUpdatedOn() {
      const { lastCaseUpdatedOn } = await knex('PatientCase')
        .max('updatedOn as lastCaseUpdatedOn')
        .first()
      return lastCaseUpdatedOn
    }

    async function getCaseExternalIdFromResultId(resultId) {
      const { caseExternalId } =
        (await knex('Result as r')
          .join('PatientCase as c', 'r.patientCaseId', 'c.id')
          .where('r.id', resultId)
          .first('c.externalId as caseExternalId')) || {}
      return caseExternalId
    }

    async function getResultCategoryDeviceTypeAndAssay(
      reportable = 1,
      caseIdTemplateLike
    ) {
      const {
        resultCategoryId,
        deviceTypeExternalId,
        assayExternalId,
      } = await knex('PartnerDisease as pd')
        .join('AssayType as at', 'pd.diseaseId', 'at.diseaseId')
        .join('Assay as a', 'at.id', 'a.assayTypeId')
        .join('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
        .join('DeviceType as dt', 'a.deviceTypeId', 'a.deviceTypeId')
        .where(function () {
          if (caseIdTemplateLike) {
            this.where('pd.caseExternalIdTemplate', 'LIKE', caseIdTemplateLike)
          } else {
            this.whereNull('pd.caseExternalIdTemplate')
          }
        })
        .andWhere('pd.partnerId', partnerId)
        .andWhere('rca.reportable', reportable)
        .first(
          'rca.resultCategoryId',
          'dt.externalId as deviceTypeExternalId',
          'a.externalId as assayExternalId'
        )
      return {
        resultCategoryId,
        deviceTypeExternalId,
        assayExternalId,
      }
    }

    it('Should not automatically create or update a case when no case ID template is specified for the disease', async () => {
      const {
        resultCategoryId,
        deviceTypeExternalId,
        assayExternalId,
      } = await getResultCategoryDeviceTypeAndAssay()
      const caseExternalId = `CASE-${new Date().getTime()}`
      const resultId = await createResult(
        partnerId,
        deviceTypeExternalId,
        'Sputum',
        assayExternalId,
        otherUserId,
        {
          resultData: JSON.stringify({ caseId: caseExternalId }),
          formData: JSON.stringify({ caseId: caseExternalId }),
          patientData: JSON.stringify({ caseId: caseExternalId }),
          resultCategory1: resultCategoryId,
        },
        {},
        true
      )
      const caseExternalIdBefore = await getCaseExternalIdFromResultId(resultId)
      assert.isNotOk(caseExternalIdBefore)
      const casesLastUpdatedOnBefore = await getLastCaseUpdatedOn()
      await onResultLogged({ resultId }, mockMessageContext())
      const casesLastUpdatedOnAfter = await getLastCaseUpdatedOn()
      assert.equal(
        casesLastUpdatedOnBefore.toISOString(),
        casesLastUpdatedOnAfter.toISOString()
      )
      const caseExternalIdAfter = await getCaseExternalIdFromResultId(resultId)
      assert.isNotOk(caseExternalIdAfter)
    })

    describe('when case ID template is specified', () => {
      it("should automatically create a case when the case doesn't exist", async () => {
        const {
          resultCategoryId,
          deviceTypeExternalId,
          assayExternalId,
        } = await getResultCategoryDeviceTypeAndAssay(
          1,
          '%result.formData.caseId%'
        )
        const caseExternalId = `CASE-${new Date().getTime()}`
        const resultId = await createResult(
          partnerId,
          deviceTypeExternalId,
          'Sputum',
          assayExternalId,
          otherUserId,
          {
            formData: JSON.stringify({ caseId: caseExternalId }),
            resultCategory1: resultCategoryId,
          },
          {},
          true
        )
        const caseExternalIdBefore = await getCaseExternalIdFromResultId(
          resultId
        )
        assert.isNotOk(caseExternalIdBefore)
        await onResultLogged({ resultId }, mockMessageContext())
        const caseExternalIdAfter = await getCaseExternalIdFromResultId(
          resultId
        )
        assert.equal(caseExternalIdAfter, caseExternalId)
      })

      it('should automatically move the result to another case', async () => {
        const {
          resultCategoryId,
          deviceTypeExternalId,
          assayExternalId,
        } = await getResultCategoryDeviceTypeAndAssay(
          1,
          '%result.formData.caseId%'
        )
        const { diseaseId } = await knex('Assay as a')
          .join('AssayType as at', 'a.assayTypeId', 'at.id')
          .where('a.externalId', assayExternalId)
          .first('at.diseaseId')
        const oldCaseExternalId = `OLD-CASE-${new Date().getTime()}`
        const [moveFromCaseId] = await knex('PatientCase').insert({
          externalId: oldCaseExternalId,
          createdOn: new Date(),
          updatedOn: new Date(),
          createdBy: otherUserId,
          updatedBy: otherUserId,
          partnerId,
          diseaseId,
        })
        const resultId = await createResult(
          partnerId,
          deviceTypeExternalId,
          'Sputum',
          assayExternalId,
          otherUserId,
          {
            formData: JSON.stringify({ caseId: oldCaseExternalId }),
            resultCategory1: resultCategoryId,
            patientCaseId: moveFromCaseId,
          },
          {},
          true
        )
        const caseExternalIdBefore = await getCaseExternalIdFromResultId(
          resultId
        )
        assert.equal(caseExternalIdBefore, oldCaseExternalId)
        const newCaseExternalId = `NEW-CASE-${new Date().getTime()}`
        await knex('PatientCase').insert({
          externalId: newCaseExternalId,
          createdOn: new Date(),
          updatedOn: new Date(),
          createdBy: otherUserId,
          updatedBy: otherUserId,
          partnerId,
          diseaseId,
        })
        await knex('Result')
          .where('id', resultId)
          .update({
            formData: JSON.stringify({ caseId: newCaseExternalId }),
          })
        await onResultLogged({ resultId }, mockMessageContext())
        const caseExternalIdAfter = await getCaseExternalIdFromResultId(
          resultId
        )
        assert.equal(caseExternalIdAfter, newCaseExternalId)
      })

      describe("and the result category assay isn't reportable", () => {
        let resultId
        let assayExternalId

        before(async () => {
          const resultCategoryDeviceTypeAndAssay = await getResultCategoryDeviceTypeAndAssay(
            0,
            '%result.formData.caseId%'
          )
          const {
            resultCategoryId,
            deviceTypeExternalId,
          } = resultCategoryDeviceTypeAndAssay
          ;({ assayExternalId } = resultCategoryDeviceTypeAndAssay)
          const caseExternalId = `CASE-${new Date().getTime()}`
          resultId = await createResult(
            partnerId,
            deviceTypeExternalId,
            'Sputum',
            assayExternalId,
            otherUserId,
            {
              formData: JSON.stringify({ caseId: caseExternalId }),
              resultCategory1: resultCategoryId,
            },
            {},
            true
          )
          const caseExternalIdBefore = await getCaseExternalIdFromResultId(
            resultId
          )
          assert.isNotOk(caseExternalIdBefore)
        })

        it("should not automatically create a case when the result isn't reportable", async () => {
          await onResultLogged({ resultId }, mockMessageContext())
          const caseExternalIdAfter = await getCaseExternalIdFromResultId(
            resultId
          )
          assert.isNotOk(caseExternalIdAfter)
        })

        it("should not automatically move the result to another case when the result isn't reportable", async () => {
          const { diseaseId } = await knex('Assay as a')
            .join('AssayType as at', 'a.assayTypeId', 'at.id')
            .where('a.externalId', assayExternalId)
            .first('at.diseaseId')
          const oldCaseExternalId = `OLD-CASE-${new Date().getTime()}`
          const [moveFromCaseId] = await knex('PatientCase').insert({
            externalId: oldCaseExternalId,
            createdOn: new Date(),
            updatedOn: new Date(),
            createdBy: otherUserId,
            updatedBy: otherUserId,
            partnerId,
            diseaseId,
          })
          const newCaseExternalId = `NEW-CASE-${new Date().getTime()}`
          await knex('PatientCase').insert({
            externalId: newCaseExternalId,
            createdBy: otherUserId,
            updatedBy: otherUserId,
            partnerId,
            diseaseId,
          })
          await knex('Result')
            .where('id', resultId)
            .update({
              formData: JSON.stringify({ caseId: newCaseExternalId }),
              patientCaseId: moveFromCaseId,
            })
          const caseExternalIdBefore = await getCaseExternalIdFromResultId(
            resultId
          )
          assert.equal(caseExternalIdBefore, oldCaseExternalId)
          await onResultLogged({ resultId }, mockMessageContext())
          const caseExternalIdAfter = await getCaseExternalIdFromResultId(
            resultId
          )
          assert.equal(caseExternalIdAfter, oldCaseExternalId)
        })
      })

      describe('extracting case ID from the test order sequence ID in the raw ASTM message', () => {
        let tbDiseaseId
        let partnerTbCaseAutoAssign
        let partnerTbCaseIdTemplate
        const astmResultExtractSequenceNumber =
          "{{extractValueFromRegexCaptureGroup result.rawData expression='O\\|\\d*\\|(\\w+)\\|' groupNumber=1}}"
        before(async () => {
          tbDiseaseId = await diseaseToId('tb')
          ;({
            canAutoAssignResultByCaseId: partnerTbCaseAutoAssign,
            caseExternalIdTemplate: partnerTbCaseIdTemplate,
          } = await knex('PartnerDisease').where({
            partnerId,
            diseaseId: tbDiseaseId,
          }))
          await knex('PartnerDisease')
            .where({ partnerId, diseaseId: tbDiseaseId })
            .update({
              canAutoAssignResultByCaseId: 1,
              caseExternalIdTemplate: astmResultExtractSequenceNumber,
            })
        })

        after(async () => {
          await knex('PartnerDisease')
            .where({ partnerId, diseaseId: tbDiseaseId })
            .update({
              canAutoAssignResultByCaseId: partnerTbCaseAutoAssign || false,
              caseExternalIdTemplate: partnerTbCaseIdTemplate || null,
            })
        })

        it("should be able to determine the result's case ID from a the raw data sent to Aspect", async () => {
          const {
            resultCategoryId,
            deviceTypeExternalId,
            assayExternalId,
          } = await knex('PartnerDisease as pd')
            .join('AssayType as at', 'pd.diseaseId', 'at.diseaseId')
            .join('Assay as a', 'at.id', 'a.assayTypeId')
            .join('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
            .join('DeviceType as dt', 'a.deviceTypeId', 'a.deviceTypeId')
            .andWhere('pd.partnerId', partnerId)
            .andWhere('pd.diseaseId', tbDiseaseId)
            .andWhere('rca.reportable', 1)
            .first(
              'rca.resultCategoryId',
              'dt.externalId as deviceTypeExternalId',
              'a.externalId as assayExternalId'
            )
          const resultId = await createResult(
            partnerId,
            deviceTypeExternalId,
            'Sputum',
            assayExternalId,
            otherUserId,
            {
              resultCategory1: resultCategoryId,
              rawData: `H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312
P|1
O|1|SYS123655|SYS123655^vl110^H12|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F
R|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695
R|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695
R|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695
L|1`,
            },
            {},
            true
          )
          const caseExternalIdBefore = await getCaseExternalIdFromResultId(
            resultId
          )
          assert.isNotOk(caseExternalIdBefore)
          await onResultLogged({ resultId }, mockMessageContext())
          const caseExternalIdAfter = await getCaseExternalIdFromResultId(
            resultId
          )
          assert.equal(caseExternalIdAfter, 'SYS123655')
        })
      })
    })
  })
})
