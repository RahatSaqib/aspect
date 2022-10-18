const { assert } = require('chai')
const { getFirstPatient, getFirstPartnerId } = require('./utils')
const { knex } = require('../../src/db')
const { getAdminId } = require('../utils/authUtils')
const { addPatient, getPatientId, removePatient, updatePatient, onResultLogged } = require('../../src/patient/service')
const { createMessageContext, waitForAction } = require('../utils/mqUtils')
const { patientAdded, patientUpdated } = require('../../src/patient/actions')
const { createResult } = require('../result/result_utils')

describe('patient/service', () => {
  const now = new Date()
  let partnerId = null
  let adminId = null
  let messageContext

  // helpers
  const getExternalId = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const mockPatient = externalId => {
    return {
      createdBy: adminId,
      updatedBy: adminId,
      externalId,
      partnerId,
      data: '{}',
    }
  }

  before(async () => {
    partnerId = await getFirstPartnerId()
    adminId = await getAdminId()

    messageContext = await createMessageContext()
    messageContext.bindActionCreators({ patientAdded, patientUpdated })
  })

  // TODO: Convert all the tests below into unit tests
  describe('add / update', () => {
    let patientId
    it('Should add case and return the id', async () => {
      const objCase = mockPatient(`Some externalId ${getExternalId()}`)

      patientId = await addPatient(objCase, { messageContext })
      assert.isNotNull(patientId)

      // check that MQ handled action with actual values
      const waitForPatientAdded = waitForAction(patientAdded(patientId))
      await waitForPatientAdded
    })

    it('Should update patient and handle MQ message', async () => {
      const patientIds = await updatePatient(
        { id: patientId },
        { externalId: `Changed externalId ${getExternalId()}` },
        { messageContext }
      )
      assert.isNotNull(patientIds)
      assert.isArray(patientIds)
      assert.isNotEmpty(patientIds)

      await Promise.all(patientIds.map(caseId => waitForAction(patientUpdated(caseId))))
    })
  })

  describe('remove', () => {
    it('Should remove patient', async () => {
      const objPatient = mockPatient(`non existent externalId ${Math.floor(Math.random() * 10000)}`)

      await addPatient(objPatient)
      await removePatient(objPatient)
      const patientId = await getPatientId(objPatient)
      assert.isNull(patientId)
    })
  })

  describe('getPatientId', () => {
    it('Providing an existent externalId and partnerId, should return the id of the patient', async () => {
      const existentPatient = await getFirstPatient()
      const patientId = await getPatientId({
        externalId: existentPatient.externalId,
        partnerId: existentPatient.partnerId,
      })
      assert.equal(patientId, existentPatient.id)
    })

    it("Providing a non existent externalId, partnerId and allowing create it, should create a new atient and return it's id", async () => {
      const createIfNonExistent = true
      const objPatient = mockPatient(`non existent externalId ${Math.floor(Math.random() * 10000)}`)

      const patientId = await getPatientId(objPatient, createIfNonExistent, adminId)
      await removePatient(objPatient)
      assert.isNotNull(patientId)
    })

    it("Providing a non existent externalId, partnerId and not allowing create it, shouldn't create a new patient and return null", async () => {
      const createIfNonExistent = false

      const objPatient = mockPatient(`non existent externalId ${Math.floor(Math.random() * 10000)}`)

      const patientId = await getPatientId(objPatient, createIfNonExistent)
      assert.isNull(patientId)
    })
  })

  describe('onResultLogged', () => {
    let partnerId
    let otherUserId
    let latestPatientIdBeforeTests
    let latestResultIdBeforeTests
    let latestSampleIdBeforeTests
    let latestDeviceIdBeforeTests
    let latestSiteIdBeforeTests

    before(async () => {
      ;({ id: latestSampleIdBeforeTests } = await knex('Sample').max('id as id').first())
      ;({ id: latestResultIdBeforeTests } = await knex('Result').max('id as id').first())
      ;({ id: latestPatientIdBeforeTests } = await knex('Patient').max('id as id').first())
      ;({ id: latestDeviceIdBeforeTests } = await knex('Device').max('id as id').first())
      ;({ id: latestSiteIdBeforeTests } = await knex('Site').max('id as id').first())

      partnerId = (await knex('Partner').where('name', 'Partner One').first('id')).id
      adminId = await getAdminId()
      otherUserId = (await knex('User').where('name', '<>', 'admin').first('id')).id
    })

    after(async () => {
      await knex('Result').where('id', '>', latestResultIdBeforeTests).del()
      await knex('Sample').where('id', '>', latestSampleIdBeforeTests).del()
      await knex('Patient').where('id', '>', latestPatientIdBeforeTests).del()
      await knex('DeviceLog').where('deviceId', '>', latestDeviceIdBeforeTests).del()
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

    async function getLastPatientUpdatedOn() {
      const { lastCaseUpdatedOn: lastPatientUpdatedOn } = await knex('Patient')
        .max('updatedOn as lastPatientUpdatedOn')
        .first()
      return lastPatientUpdatedOn || now
    }

    async function getPatientFromResultId(resultId) {
      const patient = await knex('Result as r')
        .join('Sample as s', 'r.sampleId', 's.id')
        .join('Patient as p', 's.patientId', 'p.id')
        .where('r.id', resultId)
        .first('p.*')
      return patient || {}
    }

    async function getResultCategoryDeviceTypeAndAssay(
      reportable = 1,
      reliablePatientIdTemplateLike,
      unreliablePatientIdTemplateLike
    ) {
      const { resultCategoryId, deviceTypeExternalId, assayExternalId } = await knex('PartnerAssay as pa')
        .join('Assay as a', 'pa.assayId', 'a.id')
        .join('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
        .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
        .where('pa.partnerId', partnerId)
        .andWhere(function () {
          if (reliablePatientIdTemplateLike) {
            this.where('pa.reliablePatientExternalIdTemplate', 'LIKE', reliablePatientIdTemplateLike)
            if (unreliablePatientIdTemplateLike) {
              this.andWhere('pa.unreliablePatientExternalIdTemplate', 'LIKE', unreliablePatientIdTemplateLike)
            }
          } else if (!unreliablePatientIdTemplateLike) {
            this.whereNull('pa.reliablePatientExternalIdTemplate').andWhere(function () {
              this.whereNull('pa.reliablePatientExternalIdTemplate')
            })
          } else {
            this.where('pa.unreliablePatientExternalIdTemplate', 'LIKE', unreliablePatientIdTemplateLike)
          }
        })
        .andWhere('rca.reportable', reportable)
        .first('rca.resultCategoryId', 'dt.externalId as deviceTypeExternalId', 'a.externalId as assayExternalId')
      return {
        resultCategoryId,
        deviceTypeExternalId,
        assayExternalId,
      }
    }

    it('Should not automatically create or update a patient when no patient ID template is specified for the assay', async () => {
      const { resultCategoryId, deviceTypeExternalId, assayExternalId } = await getResultCategoryDeviceTypeAndAssay()
      const patientExternalId = `PATIENT-${new Date().getTime()}`
      const resultId = await createResult(
        partnerId,
        deviceTypeExternalId,
        'Plasma',
        assayExternalId,
        otherUserId,
        {
          resultData: JSON.stringify({ patientId: patientExternalId }),
          formData: JSON.stringify({ patientId: patientExternalId }),
          patientData: JSON.stringify({ id: patientExternalId }),
          resultCategory1: resultCategoryId,
        },
        {},
        true
      )
      const patientBefore = await getPatientFromResultId(resultId)
      assert.isNotOk(patientBefore.externalId)
      const patientsLastUpdatedOnBefore = await getLastPatientUpdatedOn()
      await onResultLogged({ resultId }, mockMessageContext())
      const patientsLastUpdatedOnAfter = await getLastPatientUpdatedOn()
      assert.equal(patientsLastUpdatedOnBefore.toISOString(), patientsLastUpdatedOnAfter.toISOString())
      const patientAfter = await getPatientFromResultId(resultId)
      assert.isNotOk(patientAfter.externalId)
    })

    describe('when a reliable patient ID template is specified', () => {
      it("should automatically create a patient when the patient doesn't exist", async () => {
        const { resultCategoryId, deviceTypeExternalId, assayExternalId } = await getResultCategoryDeviceTypeAndAssay(
          1,
          '%result.formData.patientId%'
        )
        const patientExternalId = `PATIENT-${new Date().getTime()}`
        const resultId = await createResult(
          partnerId,
          deviceTypeExternalId,
          'Plasma',
          assayExternalId,
          otherUserId,
          {
            formData: JSON.stringify({ patientId: patientExternalId }),
            resultCategory1: resultCategoryId,
          },
          {},
          true
        )
        const patientBefore = await getPatientFromResultId(resultId)
        assert.isNotOk(patientBefore.externalId)
        await onResultLogged({ resultId }, mockMessageContext())
        const patientAfter = await getPatientFromResultId(resultId)
        assert.equal(patientAfter.externalId, patientExternalId)
      })

      it('should automatically move the sample & case to another patient', async () => {
        const { resultCategoryId, deviceTypeExternalId, assayExternalId } = await getResultCategoryDeviceTypeAndAssay(
          1,
          '%result.formData.patientId%'
        )
        const oldPatientExternalId = `OLD-PATIENT-${new Date().getTime()}`
        const [moveFromPatientId] = await knex('Patient').insert({
          externalId: oldPatientExternalId,
          createdOn: new Date(),
          updatedOn: new Date(),
          createdBy: otherUserId,
          updatedBy: otherUserId,
          partnerId,
          data: '{}',
        })
        const resultId = await createResult(
          partnerId,
          deviceTypeExternalId,
          'Plasma',
          assayExternalId,
          otherUserId,
          {
            formData: JSON.stringify({ patientId: oldPatientExternalId }),
            resultCategory1: resultCategoryId,
          },
          { patientId: moveFromPatientId },
          true
        )
        const patientBefore = await getPatientFromResultId(resultId)
        assert.equal(patientBefore.externalId, oldPatientExternalId)
        const newPatientExternalId = `NEW-PATIENT-${new Date().getTime()}`
        await knex('Patient').insert({
          externalId: newPatientExternalId,
          createdOn: new Date(),
          updatedOn: new Date(),
          createdBy: otherUserId,
          updatedBy: otherUserId,
          partnerId,
          data: '{}',
        })
        await knex('Result')
          .where('id', resultId)
          .update({
            formData: JSON.stringify({ patientId: newPatientExternalId }),
          })
        await onResultLogged({ resultId }, mockMessageContext())
        const patientAfter = await getPatientFromResultId(resultId)
        assert.equal(patientAfter.externalId, newPatientExternalId)
      })

      it('should automatically update the patient ID', async () => {
        const { resultCategoryId, deviceTypeExternalId, assayExternalId } = await getResultCategoryDeviceTypeAndAssay(
          1,
          '%result.formData.patientId%'
        )
        const oldPatientExternalId = `OLD-PATIENT-${new Date().getTime()}`
        const [patientId] = await knex('Patient').insert({
          externalId: oldPatientExternalId,
          createdOn: new Date(),
          updatedOn: new Date(),
          createdBy: otherUserId,
          updatedBy: otherUserId,
          partnerId,
          data: '{}',
        })
        const resultId = await createResult(
          partnerId,
          deviceTypeExternalId,
          'Plasma',
          assayExternalId,
          otherUserId,
          {
            formData: JSON.stringify({ patientId: oldPatientExternalId }),
            resultCategory1: resultCategoryId,
          },
          {
            patientId,
          },
          true
        )
        const patientBefore = await getPatientFromResultId(resultId)
        assert.equal(patientBefore.externalId, oldPatientExternalId)
        const newPatientExternalId = `NEW-PATIENT-${new Date().getTime()}`
        await knex('Result')
          .where('id', resultId)
          .update({
            formData: JSON.stringify({ patientId: newPatientExternalId }),
          })
        await onResultLogged({ resultId }, mockMessageContext())
        const patientAfter = await getPatientFromResultId(resultId)
        assert.equal(patientAfter.externalId, newPatientExternalId)
        assert.equal(patientAfter.id, patientId)
      })

      describe("and the result category assay isn't reportable", () => {
        let resultId
        let assayExternalId
        let patientExternalId

        before(async () => {
          const resultCategoryDeviceTypeAndAssay = await getResultCategoryDeviceTypeAndAssay(
            0,
            '%result.formData.patientId%'
          )
          const { resultCategoryId, deviceTypeExternalId } = resultCategoryDeviceTypeAndAssay
          ;({ assayExternalId } = resultCategoryDeviceTypeAndAssay)
          patientExternalId = `PATIENT-${new Date().getTime()}`
          resultId = await createResult(
            partnerId,
            deviceTypeExternalId,
            'Plasma',
            assayExternalId,
            otherUserId,
            {
              formData: JSON.stringify({ patientId: patientExternalId }),
              resultCategory1: resultCategoryId,
            },
            {},
            true
          )
          const patientBefore = await getPatientFromResultId(resultId)
          assert.isNotOk(patientBefore.externalId)
        })

        it('should automatically create a patient', async () => {
          await onResultLogged({ resultId }, mockMessageContext())
          const patientAfter = await getPatientFromResultId(resultId)
          assert.equal(patientAfter.externalId, patientExternalId)
        })

        it('should automatically move the sample & case to another patient', async () => {
          const oldPatientExternalId = `OLD-PATIENT-${new Date().getTime()}`
          const [moveFromPatientId] = await knex('Patient').insert({
            externalId: oldPatientExternalId,
            createdOn: new Date(),
            updatedOn: new Date(),
            createdBy: otherUserId,
            updatedBy: otherUserId,
            partnerId,
            data: '{}',
          })
          const newPatientExternalId = `NEW-PATIENT-${new Date().getTime()}`
          await knex('Patient').insert({
            externalId: newPatientExternalId,
            createdOn: new Date(),
            updatedOn: new Date(),
            createdBy: otherUserId,
            updatedBy: otherUserId,
            partnerId,
            data: '{}',
          })
          const { sampleId } = await knex('Result').where('id', resultId).first('sampleId')
          await knex('Sample').where('id', sampleId).update({ patientId: moveFromPatientId })
          await knex('Result')
            .where('id', resultId)
            .update({
              formData: JSON.stringify({ patientId: newPatientExternalId }),
            })
          const patientBefore = await getPatientFromResultId(resultId)
          assert.equal(patientBefore.externalId, oldPatientExternalId)
          await onResultLogged({ resultId }, mockMessageContext())
          const patientAfter = await getPatientFromResultId(resultId)
          assert.equal(patientAfter.externalId, newPatientExternalId)
        })
      })
    })

    describe('when an unreliable patient ID template is specified', () => {
      it("should automatically create a patient when the patient doesn't exist", async () => {
        const { resultCategoryId, deviceTypeExternalId, assayExternalId } = await getResultCategoryDeviceTypeAndAssay(
          1,
          '',
          "%extractValueFromRegexCaptureGroup result.rawData expression='^P%"
        )
        const patientExternalId = `PATIENT-${new Date().getTime()}`
        const resultId = await createResult(
          partnerId,
          deviceTypeExternalId,
          'Plasma',
          assayExternalId,
          otherUserId,
          {
            resultCategory1: resultCategoryId,
            rawData: `H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312
P|1|${patientExternalId}|
O|1|SYS123655|SYS123655^vl110^H12|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F
R|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695
R|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695
R|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695
L|1`,
          },
          {},
          true
        )
        const patientBefore = await getPatientFromResultId(resultId)
        assert.isNotOk(patientBefore.externalId)
        await onResultLogged({ resultId }, mockMessageContext())
        const patientAfter = await getPatientFromResultId(resultId)
        assert.equal(patientAfter.externalId, patientExternalId)
      })

      it('should NOT automatically move the sample & case to another patient', async () => {
        const { resultCategoryId, deviceTypeExternalId, assayExternalId } = await getResultCategoryDeviceTypeAndAssay(
          1,
          '',
          "%extractValueFromRegexCaptureGroup result.rawData expression='^P%"
        )
        const oldPatientExternalId = `OLD-PATIENT-${new Date().getTime()}`
        const [moveFromPatientId] = await knex('Patient').insert({
          externalId: oldPatientExternalId,
          createdOn: new Date(),
          updatedOn: new Date(),
          createdBy: otherUserId,
          updatedBy: otherUserId,
          partnerId,
          data: '{}',
        })
        const resultId = await createResult(
          partnerId,
          deviceTypeExternalId,
          'Plasma',
          assayExternalId,
          otherUserId,
          {
            resultCategory1: resultCategoryId,
            rawData: `H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312
P|1|${oldPatientExternalId}|
O|1|SYS123655|SYS123655^vl110^H12|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F
R|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695
R|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695
R|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695
L|1`,
          },
          {
            patientId: moveFromPatientId,
          },
          true
        )
        const patientBefore = await getPatientFromResultId(resultId)
        assert.equal(patientBefore.externalId, oldPatientExternalId)
        const newPatientExternalId = `NEW-PATIENT-${new Date().getTime()}`
        await knex('Patient').insert({
          externalId: newPatientExternalId,
          createdOn: new Date(),
          updatedOn: new Date(),
          createdBy: otherUserId,
          updatedBy: otherUserId,
          partnerId,
          data: '{}',
        })
        await knex('Result')
          .where('id', resultId)
          .update({
            rawData: `H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312
P|1|${newPatientExternalId}|
O|1|SYS123655|SYS123655^vl110^H12|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F
R|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695
R|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695
R|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695
L|1`,
          })
        await onResultLogged({ resultId }, mockMessageContext())
        const patientAfter = await getPatientFromResultId(resultId)
        assert.equal(patientAfter.externalId, oldPatientExternalId)
      })

      it('should NOT update an existing patient ID', async () => {
        const { resultCategoryId, deviceTypeExternalId, assayExternalId } = await getResultCategoryDeviceTypeAndAssay(
          1,
          '',
          "%extractValueFromRegexCaptureGroup result.rawData expression='^P%"
        )
        const oldPatientExternalId = `OLD-PATIENT-${new Date().getTime()}`
        const [moveFromPatientId] = await knex('Patient').insert({
          externalId: oldPatientExternalId,
          createdOn: new Date(),
          updatedOn: new Date(),
          createdBy: otherUserId,
          updatedBy: otherUserId,
          partnerId,
          data: '{}',
        })
        const resultId = await createResult(
          partnerId,
          deviceTypeExternalId,
          'Plasma',
          assayExternalId,
          otherUserId,
          {
            resultCategory1: resultCategoryId,
            rawData: `H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312
P|1|${oldPatientExternalId}|
O|1|SYS123655|SYS123655^vl110^H12|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F
R|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695
R|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695
R|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695
L|1`,
          },
          {
            patientId: moveFromPatientId,
          },
          true
        )
        const patientBefore = await getPatientFromResultId(resultId)
        assert.equal(patientBefore.externalId, oldPatientExternalId)
        const newPatientExternalId = `NEW-PATIENT-${new Date().getTime()}`
        await knex('Result')
          .where('id', resultId)
          .update({
            rawData: `H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312
P|1|${newPatientExternalId}|
O|1|SYS123655|SYS123655^vl110^H12|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F
R|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695
R|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695
R|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695
L|1`,
          })
        await onResultLogged({ resultId }, mockMessageContext())
        const patientAfter = await getPatientFromResultId(resultId)
        assert.equal(patientAfter.externalId, oldPatientExternalId)
      })
    })
  })
})
