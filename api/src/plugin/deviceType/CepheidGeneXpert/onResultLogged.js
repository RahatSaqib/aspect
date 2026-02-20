const _ = require('lodash')
const { resultCategoryToId, resultSourceToId } = require('../../../shared/dictionary')
const { parseDateOrDefault } = require('../../../shared/date')
const { processUsingDataSourceQuery } = require('../../../stringTemplate/service')
const { getResultForStringTemplateProcessing } = require('../../../result/service')
const { RESULT_STRING_TEMPLATE_FIELDS } = require('../../../result/query')
const { resultUnusedModules } = require('../../../result/actions')

const { shouldTriggerModuleReplaced, shouldTriggerResultErrorAnalysis } = require('../../utils')
const logger = require('../../../shared/logger')

async function onResultLogged({ resultId, deviceLogId, userId }, { messageContext }) {
  return messageContext.run(async knex => {
    logger.debug([resultId, deviceLogId, userId], {
      reLabel: 'mq:onResultLogged',
    })

    const { externalId: deviceLogDeviceTypeExternalId } =
      (await knex('DeviceLog as dl')
        .join('Device as d', 'dl.deviceApiKeyId', 'd.deviceApiKeyId')
        .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where(function () {
          if (deviceLogId) {
            this.where('dl.id', deviceLogId)
          } else {
            this.where('dl.resultId', resultId)
          }
        })
        .orderBy('dl.id', 'desc')
        .first('dt.externalId')) || {}

    if (!['Aspect', 'CepheidGeneXpert', 'GxAlert'].includes(deviceLogDeviceTypeExternalId)) {
      return
    }
    const result = await getResultForStringTemplateProcessing(
      resultId,
      [
        ...RESULT_STRING_TEMPLATE_FIELDS,
        'r.instrumentSerial',
        'r.assayId',
        'd.id as resultDeviceId',
        'rc1.externalId as resultCategory1',
        knex.raw(
          "case when rc1.externalId in ('Error', 'Invalid', 'NoResult') then rc1.externalid else 'Success' end as resultOutcome"
        ),
      ],
      knex
    )
    if (result) {
      const {
        assayId,
        resultModuleSerial,
        consumableLot,
        resultDeviceId,
        resultErrorCode,
        resultOutcome,
        resultCategory1,
        instrumentSerial,
        resultModuleName,
        resultStartedOn,
        resultEndedOn,
      } = result
      await shouldTriggerModuleReplaced(
        knex,
        messageContext,
        resultId,
        resultDeviceId,
        resultModuleSerial,
        instrumentSerial,
        resultModuleName,
        resultStartedOn
      )
      await shouldTriggerResultErrorAnalysis(
        messageContext,
        resultDeviceId,
        resultId,
        resultCategory1,
        resultErrorCode,
        {
          resultOutcome,
          moduleSerial: resultModuleSerial,
          assayId,
          consumableLot,
          resultEndedOn,
          instrumentSerial,
        }
      )

      if (!messageContext.resultUnusedModules) {
        messageContext = messageContext.bindActionCreators({
          resultUnusedModules,
        })
      }
      await messageContext.resultUnusedModules(resultDeviceId)

      if (deviceLogDeviceTypeExternalId === 'Aspect') {
        await updateCovidResultFromFormData({ result, deviceLogId, userId }, { messageContext })
      }
    }
  })
}

async function updateCovidResultFromFormData({ result, userId }, { messageContext }) {
  return messageContext.transact(async knex => {
    // check if a module was replaced and trigger replacement-issue if it was
    const {
      resultId,
      assayExternalId,
      caseExternalIdTemplate,
      resultStartedOn,
      resultEndedOn,
      resultFormData,
      diseaseId,
      resultPatientData,
      resultCategory1,
      resultData,
    } = result
    const covid19AssayExternalIds = await knex('AssayType as at')
      .join('Assay as a', 'at.id', 'a.assayTypeId')
      .where('at.externalId', 'covid19')
      .pluck('a.externalId')
    if (!covid19AssayExternalIds.includes(assayExternalId)) {
      return
    }
    const resultUpdates = {}
    let formDataObject
    if (resultFormData) {
      formDataObject = JSON.parse(resultFormData)
    }
    if (_.isEmpty(formDataObject)) {
      return
    }
    let patientDataObject = {}
    let originalPatientDataObject = {}
    if (resultPatientData) {
      patientDataObject = JSON.parse(resultPatientData)
      originalPatientDataObject = JSON.parse(resultPatientData)
    }
    let resultDataObject = {}
    let originalResultDataObject = {}
    if (resultData) {
      resultDataObject = JSON.parse(resultData)
      originalResultDataObject = JSON.parse(resultData)
    }
    const diagnosticDeviceResoultSourceId = await resultSourceToId('DiagnosticDevice')
    const [{ deviceLogCountFromDiagnosticDevice }] = await knex('DeviceLog as dl')
      .join('Device as d', 'dl.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('Assay as a', 'dt.id', 'a.deviceTypeId')
      .where('dl.resultId', resultId)
      .andWhere('a.resultSourceId', diagnosticDeviceResoultSourceId)
      .count('dl.id as deviceLogCountFromDiagnosticDevice')
    const canOverwriteDiagnosticDataByHand = deviceLogCountFromDiagnosticDevice === 0

    if (diseaseId) {
      let caseExternalId
      if (caseExternalIdTemplate) {
        ;({ reliableCaseExternalId: caseExternalId } =
          (await processUsingDataSourceQuery({ ...result, caseExternalIdTemplate }, [
            'reliableCaseExternalIdTemplate',
          ])) || {})
      }
      if (!caseExternalId) {
        caseExternalId = formDataObject.caseId
      }
      if (caseExternalId) {
        if (canOverwriteDiagnosticDataByHand) {
          patientDataObject.id = caseExternalId
        } else if (caseExternalId) {
          patientDataObject.id = patientDataObject.id || caseExternalId
        }
      }
    }

    patientDataObject.testReason = formDataObject.testReasonOther || patientDataObject.testReason
    patientDataObject.age =
      formDataObject.age ||
      (formDataObject.ageYears ? `${formDataObject.ageYears} years` : null) ||
      (formDataObject.ageMonths ? `${formDataObject.ageMonths} months` : null) ||
      (formDataObject.ageDays ? `${formDataObject.ageDays} days` : null)

    if (!_.isEqual(patientDataObject, originalPatientDataObject)) {
      resultUpdates.patientData = JSON.stringify(patientDataObject)
    }
    let testDate
    if (formDataObject.dateAndTimeOfTest) {
      testDate = parseDateOrDefault(formDataObject.dateAndTimeOfTest)
    }
    if (canOverwriteDiagnosticDataByHand) {
      if (testDate) {
        resultUpdates.endedOn = testDate || resultEndedOn
        resultUpdates.startedOn = testDate || resultStartedOn
      }
    }
    if (!_.isEqual(resultDataObject, originalResultDataObject)) {
      if (resultDataObject.resultText) {
        const resultCategoryId = await resultCategoryToId(resultDataObject.resultText)
        if (resultCategoryId && resultCategoryId !== resultCategory1) {
          resultUpdates.resultCategory1 = resultCategoryId
        }
      }
      resultUpdates.resultData = JSON.stringify(resultDataObject)
    }
    if (_.isEmpty(resultUpdates)) {
      return
    }

    resultUpdates.updatedOn = new Date()
    resultUpdates.updatedBy = userId
    await knex('Result').where('id', resultId).update(resultUpdates)
  })
}

module.exports = onResultLogged
