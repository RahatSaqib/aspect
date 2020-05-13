const _ = require('lodash')
const {
  resultCategoryToId,
  resultSourceToId,
} = require('../../../shared/dictionary')
const { parseDateOrDefault } = require('../../../shared/date')
const { getCaseId, updateCase } = require('../../../case/service')
const {
  processUsingDataSourceQuery,
} = require('../../../stringTemplate/service')

async function onResultLogged(
  { resultId, deviceLogId, userId },
  { messageContext }
) {
  await updateCovidResultFromFormData(
    { resultId, deviceLogId, userId },
    { messageContext }
  )
}

async function updateCovidResultFromFormData(
  { resultId, deviceLogId, userId },
  { messageContext }
) {
  return messageContext.transact(async knex => {
    const { externalId: deviceLogDeviceTypeExternalId } =
      (await knex('DeviceLog as dl')
        .join('Device as d', 'dl.deviceId', 'd.id')
        .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where(function() {
          if (deviceLogId) {
            this.where('dl.id', deviceLogId)
          } else {
            this.where('dl.resultId', resultId)
          }
        })
        .orderBy('dl.id', 'desc')
        .first('dt.externalId')) || {}
    if (deviceLogDeviceTypeExternalId !== 'Aspect') {
      return
    }
    const result = await knex('Result as r')
      .join('Assay as a', 'r.assayId', 'a.id')
      .join('AssayType as at', 'a.assayTypeId', 'at.id')
      .join('Site as s', 'r.siteId', 's.id')
      .join('Device as d', 'r.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('Sample as s', 'r.sampleId', 's.id')
      .join('ResultForm as rf', function() {
        this.on('a.id', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
      })
      .join('Partner as p', 'r.partnerId', 'p.id')
      .leftJoin('PartnerDisease as pd', function() {
        this.on('at.diseaseId', 'pd.diseaseId').andOn(
          'r.partnerId',
          'pd.partnerId'
        )
      })
      .leftJoin('Case as c', 'r.caseId', 'c.id')
      .leftJoin('Site as sos', 's.sampleOriginSiteId', 'sos.id')
      .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
      .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
      .where({ 'r.id': resultId })
      .first(
        'p.plugin as partnerPlugin',
        's.externalId as siteExternalId',
        's.name as siteName',
        's.shortname as siteShortName',
        's.externalId as siteExternalId',
        'd.name as deviceName',
        'd.externalId as deviceTypeExternalId',
        'd.lastSeenOn as deviceLastSeenOn',
        'd.lastPingOn as deviceLastPingOn',
        'r.resultData',
        'r.formData as resultFormData',
        'r.patientData as resultPatientData',
        'r.startedOn as resultStartedOn',
        'r.endedOn as resultEndedOn',
        'r.notes as resultNotes',
        'r.consumableSerial',
        'r.createdOn',
        'r.senderOperator',
        'r.moduleName as resultModuleName',
        'r.moduleSerial as resultModuleSerial',
        'r.errorCode as resultErrorCode',
        'r.errorNotes as resultErrorNotes',
        'a.externalId as assayExternalId',
        's.externalId as sampleExternalId',
        'sos.externalId as sampleOriginSiteExternalId',
        's.collectedOn as sampleCollectedOn',
        'rc1.externalId as resultCategory1ExternalId',
        'rc2.externalId as resultCategory2ExternalId',
        'dt.externalId as resultDeviceTypeExternalId',
        'a.resultSourceId',
        'r.partnerId',
        'rf.formSchema',
        'r.resultCategory1',
        'at.diseaseId',
        'pd.canAutoAssignResultByCaseId',
        'pd.caseExternalIdTemplate',
        'r.caseId as existingCaseId',
        'c.externalId as existingCaseExternalId'
      )

    if (!result) {
      return
    }
    const {
      assayExternalId,
      canAutoAssignResultByCaseId,
      caseExternalIdTemplate,
      resultStartedOn,
      resultEndedOn,
      resultFormData,
      formSchema,
      partnerId,
      diseaseId,
      resultPatientData,
      resultCategory1,
      resultData,
      existingCaseId,
      existingCaseExternalId,
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
    let formSchemaObject = {}
    if (formSchema) {
      formSchemaObject = JSON.parse(formSchema)
    }
    const diagnosticDeviceResoultSourceId = await resultSourceToId(
      'DiagnosticDevice'
    )
    const [{ deviceLogCountFromDiagnosticDevice }] = await knex(
      'DeviceLog as dl'
    )
      .join('Device as d', 'dl.deviceId', 'd.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('Assay as a', 'dt.id', 'a.deviceTypeId')
      .where('dl.resultId', resultId)
      .andWhere('a.resultSourceId', diagnosticDeviceResoultSourceId)
      .count('dl.id as deviceLogCountFromDiagnosticDevice')
    const canOverwriteDiagnosticDataByHand =
      deviceLogCountFromDiagnosticDevice === 0

    const now = new Date()
    let caseExternalId
    if (diseaseId) {
      if (caseExternalIdTemplate) {
        ;({ caseExternalId } =
          (await processUsingDataSourceQuery(
            { ...result, caseExternalIdTemplate },
            ['caseExternalIdTemplate']
          )) || {})
      }
      if (!caseExternalId) {
        caseExternalId = formDataObject.caseId
      }
      if (caseExternalId) {
        if (canAutoAssignResultByCaseId) {
          // Get the case that matched the case ID in the payload
          // If the case doesn't exist and the result is not assigned a case yet, creat the case
          let caseId = await getCaseId(
            { partnerId, externalId: caseExternalId, diseaseId },
            !existingCaseId,
            userId
          )
          // If no case was found or created, use the case already assigned to the result
          if (!caseId) {
            caseId = existingCaseId
          }
          // Lookup if any other cased have the smae case number
          const otherCaseId = await getCaseId(
            { partnerId, externalId: caseExternalId, diseaseId },
            false,
            userId
          )
          // If the case number has changed...
          if (
            caseExternalId !== existingCaseExternalId &&
            (!otherCaseId || otherCaseId === existingCaseId)
          ) {
            // ...to an unknown case number, update the case
            if (!otherCaseId || otherCaseId === existingCaseId) {
              await updateCase(
                { id: existingCaseId },
                {
                  externalId: caseExternalId,
                  updatedBy: userId,
                  updatedOn: now,
                }
              )
              resultUpdates.caseId = caseId
            } else {
              // ...to a known case number, move the result to the known case
              resultUpdates.caseId = otherCaseId
            }
          }
        }
      }
      if (canOverwriteDiagnosticDataByHand && caseExternalId) {
        patientDataObject.id = caseExternalId
      } else if (caseExternalId) {
        patientDataObject.id = patientDataObject.id || caseExternalId
      }
    }

    const testReasonOptions =
      _.get(formSchemaObject, 'fields.testReason.control.options') || []
    patientDataObject.testReason =
      (
        testReasonOptions.find(
          option => option.value == formDataObject.testReason // eslint-disable-line eqeqeq
        ) || {}
      ).title ||
      formDataObject.testReasonOther ||
      patientDataObject.testReason
    patientDataObject.age =
      formDataObject.age ||
      (formDataObject.ageYears ? `${formDataObject.ageYears} years` : null) ||
      (formDataObject.ageMonths
        ? `${formDataObject.ageMonths} months`
        : null) ||
      (formDataObject.ageDays ? `${formDataObject.ageDays} days` : null)
    const genderOptions =
      _.get(formSchemaObject, 'fields.gender.control.options') || []
    patientDataObject.gender =
      (
        genderOptions.find(
          option => option.value == formDataObject.gender // eslint-disable-line eqeqeq
        ) || {}
      ).title || patientDataObject.gender
    if (!_.isEqual(patientDataObject, originalPatientDataObject)) {
      resultUpdates.patientData = JSON.stringify(patientDataObject)
    }
    const testResultOptions =
      _.get(formSchemaObject, 'fields.testResult.control.options') || []
    const selectedResultText = (
      testResultOptions.find(
        option => option.value == formDataObject.testResult // eslint-disable-line eqeqeq
      ) || {}
    ).title
    let testDate
    if (formDataObject.dateAndTimeOfTest) {
      testDate = parseDateOrDefault(formDataObject.dateAndTimeOfTest)
    }
    if (canOverwriteDiagnosticDataByHand) {
      resultDataObject.resultText =
        selectedResultText || resultDataObject.resultText
      if (testDate) {
        resultUpdates.endedOn = testDate || resultEndedOn
        resultUpdates.startedOn = testDate || resultStartedOn
      }
    } else if (selectedResultText) {
      resultDataObject.resultText =
        resultDataObject.resultText || selectedResultText
      if (
        resultDataObject.resultText === 'Unknown' &&
        selectedResultText !== 'Unknown'
      ) {
        resultDataObject.resultText = selectedResultText
      }
      if (testDate) {
        resultUpdates.endedOn = resultEndedOn || testDate
        resultUpdates.startedOn = resultStartedOn || testDate
      }
    }
    if (assayExternalId === 'assayGenericCovid19') {
      const testTypeOptions =
        _.get(formSchemaObject, 'fields.testType.control.options') || []
      const selectedTestType = (
        testTypeOptions.find(
          option => option.value == formDataObject.testType // eslint-disable-line eqeqeq
        ) || {}
      ).title
      resultDataObject.typeOfTest =
        selectedTestType || resultDataObject.typeOfTest
    }
    if (!_.isEqual(resultDataObject, originalResultDataObject)) {
      if (resultDataObject.resultText) {
        const resultCategoryId = await resultCategoryToId(
          resultDataObject.resultText
        )
        if (resultCategoryId && resultCategoryId !== resultCategory1) {
          resultUpdates.resultCategory1 = resultCategoryId
        }
      }
      resultUpdates.resultData = JSON.stringify(resultDataObject)
    }
    if (_.isEmpty(resultUpdates)) {
      return
    }
    resultUpdates.updatedOn = now
    resultUpdates.updatedBy = userId
    await knex('Result')
      .where('id', resultId)
      .update(resultUpdates)
  })
}

module.exports = onResultLogged
