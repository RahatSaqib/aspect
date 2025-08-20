const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('@hapi/boom')
const { formatDateOrDefault, parseDateOrDefault } = require('../../../shared/date')
const { getRemoteAddress } = require('../../../shared/request')
const { SynchronousDataProcessor } = require('../_base')
const { postPayloadFromDevice } = require('../../../device/service')
const { deviceApprovalToId } = require('../../../shared/dictionary')
const { deviceSeen } = require('../../../device/actions')
const { transact } = require('../../../db')
const {
  resultSourceToId,
  resultTypeToId,
  allSampleTypeToId,
  allResultCategoryToId,
  allResultWorkflowStatusToId,
} = require('../../../shared/dictionary')
const { resultLogged } = require('../../../result/actions')

const sampleTypeMappings = { Sputum: 'Sputum' }

class TruenatResult extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.timeoutMilliseconds = 60000
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static async canProcessRequest(request) {
    const { params } = request
    const path = _.get(params, 'params', '').toLowerCase()
    return Promise.resolve(path.startsWith('truelab/results/upload'))
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    this.response = { deviceApiRawId: this.id }
    const utcNow = new Date()

    try {
      await transact(async knex => {
        const deviceDetails = await getDeviceDetailsFromApiKey(knex, auth.credentials.token)
        const {
          deviceId,
          username,
          deviceApiKeyId,
          partnerId,
          deviceApprovalId,
          deviceName,
          longitude,
          latitude,
          siteName,
          deviceDefaultReportableSiteId,
          siteExternalId,
          deviceTypeExternalId,
        } = deviceDetails
        let { siteId } = deviceDetails

        if (!deviceId) {
          throw Boom.badRequest('Invalid device API key: Cannot determine which device this came from')
        }

        const {
          rawMessage,
          patientName,
          patientId,
          sampleTypeName,
          testName,
          patientAge,
          patientGender,
          resultStatus,
          finalResult,
          validityStatus,
          senderOperator,
          labName,
          doctorName,
          ctLabel1,
          ct1,
          ctResult1,
          ctLabel2,
          ct2,
          ctResult2,
          cLabel3,
          ct3,
          ctResult3,
          notes,
          date,
          time,
        } = getDetailsFromRequest(request)

        const assigned = await deviceApprovalToId('assigned')
        if (deviceApprovalId === assigned && labName && deviceName === username && siteName === username) {
          const site = await knex('Site').where('name', labName).where('partnerId', partnerId).first()
          if (site) {
            await knex('Device').where('id', deviceId).update({ siteId: site.id })
            await knex('DeviceApiKey').where('id', deviceApiKeyId).update({ siteId: site.id })
            // attempt to delete automatically created site if there are no related records
            const devicesCount = await knex('Device').where('siteId', siteId).count('id')
            const resultsCount = await knex('Result').where('siteId', siteId).count('id')
            const inventoryItemsCount = await knex('InventoryItem').where('siteId', siteId).count('id')
            const inventoryLogsCount = await knex('InventoryLog').where('siteId', siteId).count('id')
            const jobContextsCount = await knex('JobContext').where('siteId', siteId).count('id')
            if (
              devicesCount === 0 &&
              resultsCount === 0 &&
              inventoryItemsCount === 0 &&
              inventoryLogsCount === 0 &&
              jobContextsCount === 0
            ) {
              await knex('AlertMessage').where('siteId', siteId).update({ siteId: null })
              await knex('EmailMessage').where('siteId', siteId).update({ siteId: null })
              await knex('SmsMessage').where('siteId', siteId).update({ siteId: null })
              await knex('WebhookMessage').where('siteId', siteId).update({ siteId: null })
              await knex('DeviceApiKey').where('siteId', siteId).update({ siteId: null })
              await knex('Issue').where('siteId', siteId).update({ siteId: null })
              await knex('DeviceSiteHistory').where('id', siteId).delete()
              await knex('FactInventoryConsumptionRate').where('id', siteId).delete()
              await knex('Site').where('id', siteId).delete()
            }
            siteId = site.id
          } else {
            await knex('Site').where('id', siteId).update({ name: labName })
          }
          await knex('Device').where('id', deviceId).update({ name: labName })
        }

        const assay = await getAssay(knex, testName)

        const sampleExternalId = generateSampleExternalId(
          deviceTypeExternalId,
          assay.abbreviation,
          siteExternalId,
          patientId || patientName,
          sampleTypeName
        )
        const sampleTypeId = await getSampleTypeId(sampleTypeName)
        const sampleId = await getOrCreateSampleId(knex, sampleExternalId, sampleTypeId, deviceDefaultReportableSiteId)

        const resultCategory1 = await determineResultCategory1Id(
          finalResult,
          assay.externalId,
          testName,
          ctResult3,
          validityStatus,
          resultStatus
        )

        const resultTime = parseDateOrDefault(`${date} ${time}`, {
          formatString: 'yyyy-MM-dd HH-mm-ss',
          backupDate: utcNow,
        })
        let resultExternalId = generateResultExternalId(sampleExternalId, resultTime)
        const existingResult = await knex('Result')
          .where({ externalId: resultExternalId, deviceId })
          .orWhere({ sampleId, siteId, assayId: assay.id })
          .first()

        const resultSourceId = await resultSourceToId('DiagnosticDevice')
        const resultTypeId = await resultTypeToId('Patient')
        const resultText = (finalResult || '').trim() === '' ? ctResult3 : finalResult.trim()
        const newResultDetails = {
          partnerId,
          siteId,
          deviceId,
          assayId: assay.id,
          longitude,
          latitude,
          resultSourceId,
          resultTypeId,
          patientData: JSON.stringify({
            doctorName,
            id: patientId,
            patientName,
            gender: patientGender,
            age: patientAge,
          }),
          resultData: JSON.stringify({
            finalResult,
            status: resultStatus,
            validityStatus,
            ctLabel1,
            ct1,
            ctResult1,
            ctLabel2,
            ct2,
            ctResult2,
            cLabel3,
            ct3,
            ctResult3,
            labName,
            testName,
            resultText,
          }),
          rawData: rawMessage,
          updatedOn: utcNow,
          sampleId,
          resultCategory1,
          senderOperator,
          notes,
          reportableSiteId: _.get(existingResult, 'reportableSiteId') || deviceDefaultReportableSiteId || siteId,
        }
        if (resultTime) {
          newResultDetails.startedOn = resultTime
          if (['Complete', 'Completed', 'Aborted'].includes(resultStatus)) {
            newResultDetails.endedOn = resultTime
          }
        }
        const result = {
          createdOn: utcNow,
          ...(existingResult || {}),
          ...newResultDetails,
          externalId: resultExternalId,
        }
        if (!result.id) {
          const [resultId] = await knex('Result').insert(result)
          result.id = resultId
        } else {
          resultExternalId = existingResult.externalId
          await knex('Result').where('id', result.id).update(newResultDetails)
        }

        const deviceLogId = await postPayloadFromDevice(
          {
            deviceId,
            source: 'Diagnostic Device POST',
            senderIp: getRemoteAddress(request),
            resultId: result.id,
            rawMessage: JSON.stringify(request.plugins.rawPayload),
          },
          knex
        )

        await logResultWorkflow(
          knex,
          this.messageContext,
          result.id,
          resultStatus,
          validityStatus,
          senderOperator,
          labName,
          utcNow,
          result.resultWorkflowStatusLogId,
          deviceLogId
        )

        this.messageContext.dispatch(deviceSeen(deviceId))
        this.response.resultExternalId = resultExternalId
      })
      this.response.success = true
      this.responseStatusCode = 201
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload))
      throw e
    }
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

async function getDeviceDetailsFromApiKey(knex, deviceApiToken) {
  const deviceDetails = await knex('DeviceApiKey as dak')
    .join('Device as d', 'dak.deviceId', 'd.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('Site as s', 'd.siteId', 's.id')
    .where('dak.token', deviceApiToken)
    .first(
      'dak.deviceId',
      'dak.username',
      'dak.id as deviceApiKeyId',
      'd.partnerId',
      'd.siteId',
      'd.deviceApprovalId',
      'd.name as deviceName',
      's.geographyId',
      's.longitude',
      's.latitude',
      's.name as siteName',
      'd.defaultReportableSiteId as deviceDefaultReportableSiteId',
      's.externalId as siteExternalId',
      'dt.externalId as deviceTypeExternalId'
    )
  return deviceDetails || {}
}

function getDetailsFromRequest(request) {
  const {
    payload,
    plugins: { rawPayload },
  } = request

  let finalResult = _.get(payload, 'FinalResult')?.trim() ?? ''
  if (finalResult === '' || finalResult === 'null') {
    finalResult = null
  }

  return {
    rawMessage: JSON.stringify(rawPayload),
    patientName: _.get(payload, 'PatientName')?.trim(),
    patientId: _.get(payload, 'PatientID')?.trim(),
    sampleTypeName: _.get(payload, 'SampleType')?.trim(),
    testName: _.get(payload, 'TestName')?.trim(),
    patientAge: _.get(payload, 'Age')?.toString()?.trim(),
    patientGender: _.get(payload, 'Gender')?.trim(),
    resultStatus: _.get(payload, 'Status')?.trim(),
    finalResult,
    validityStatus: _.get(payload, 'ValidityStatus')?.trim(),
    senderOperator: _.get(payload, 'User')?.trim(),
    labName: _.get(payload, 'LabName')?.trim(),
    doctorName: _.get(payload, 'DoctorName')?.trim(),
    ctLabel1: _.get(payload, 'CtLabel1')?.trim(),
    ct1: _.get(payload, 'Ct1')?.trim(),
    ctResult1: _.get(payload, 'CtResult1')?.trim(),
    ctLabel2: _.get(payload, 'CtLabel2')?.trim(),
    ct2: _.get(payload, 'Ct2')?.trim(),
    ctResult2: _.get(payload, 'CtResult2')?.trim(),
    cLabel3: _.get(payload, 'CtLabel3')?.trim(),
    ct3: _.get(payload, 'Ct3')?.trim(),
    ctResult3: _.get(payload, 'CtResult3')?.trim(),
    notes: _.get(payload, 'Notes')?.trim(),
    date: _.get(payload, 'Date')?.trim(),
    time: _.get(payload, 'Time')?.trim(),
  }
}

async function getAssay(knex, testName) {
  const assayExternalId =
    {
      MTB: 'assayTruenatMtb',
      'MTB Plus': 'assayTruenatMtbPlus',
      'MTB RIF': 'assayTruenatRif',
    }[testName] || 'assayTruenatUnknown'
  const assay = await knex('Assay').where('externalId', assayExternalId).first()
  return assay
}

function generateSampleExternalId(
  deviceTypeExternalId,
  assayAbbreviation,
  siteExternalId,
  patientIdOrName,
  sampleTypeName
) {
  return `${deviceTypeExternalId}_${assayAbbreviation}_${siteExternalId}_${patientIdOrName}_${
    sampleTypeMappings[sampleTypeName] || 'Unknown'
  }`
}

async function getSampleTypeId(sampleTypeName) {
  const sampleTypeIds = await allSampleTypeToId()
  const sampleTypeId = sampleTypeMappings[sampleTypeName] ? sampleTypeIds[sampleTypeMappings[sampleTypeName]] : null
  return sampleTypeId
}

async function getOrCreateSampleId(knex, sampleExternalId, sampleTypeId, originSiteId) {
  let { id: sampleId } = (await knex('Sample').where('externalId', sampleExternalId).first('id')) || {}
  if (!sampleId) {
    const now = new Date()
    ;[sampleId] = await knex('Sample').insert({
      externalId: sampleExternalId,
      sampleTypeId,
      originSiteId,
      createdOn: now,
      updatedOn: now,
    })
  }
  return sampleId
}

function generateResultExternalId(sampleExternalId, dateReceived) {
  return `${sampleExternalId}_${formatDateOrDefault(dateReceived, 'yyyyMMddhhmmss')}`
}

async function determineResultCategory1Id(
  finalResult,
  assayExternalId,
  testName,
  ctResult3,
  validityStatus,
  resultStatus
) {
  const resultCategoryIds = await allResultCategoryToId()
  let resultCategory1Id =
    assayExternalId === 'assayTruenatUnknown'
      ? resultCategoryIds.Unknown
      : {
          Positive: resultCategoryIds.Detected,
          Detected: resultCategoryIds.Detected,
          'Rif Resistance detected': resultCategoryIds.Detected,
          Negative: resultCategoryIds.NotDetected,
          'Not Detected': resultCategoryIds.NotDetected,
          'Rif Resistance not detected': resultCategoryIds.NotDetected,
          Invalid: resultCategoryIds.Invalid,
          Indeterminate: resultCategoryIds.Indeterminate,
          Error: resultCategoryIds.Error,
        }[finalResult]

  resultCategory1Id = resultCategory1Id || resultCategoryIds.Missing

  if (resultCategory1Id === resultCategoryIds.Missing) {
    if (testName === 'MTB' || testName === 'MTB Plus') {
      if (['Completed', 'Complete'].includes(resultStatus) && !finalResult) {
        if (validityStatus === 'Valid' && ctResult3) {
          if (ctResult3.indexOf('NOT DETECTED') !== -1) {
            resultCategory1Id = resultCategoryIds.NotDetected
          } else if (ctResult3.indexOf('DETECTED') !== -1) {
            resultCategory1Id = resultCategoryIds.Detected
          }
        } else if (validityStatus === 'Invalid') {
          resultCategory1Id = resultCategoryIds.Invalid
        }
      }
    }
  }

  return resultCategory1Id
}

async function logResultWorkflow(
  knex,
  messageContext,
  resultId,
  resultStatus,
  validityStatus,
  operator,
  labName,
  utcNow,
  currentResultWorkflowStatusLogId,
  deviceLogId
) {
  const resultWorkflowStatuses = await allResultWorkflowStatusToId()
  let resultWorkflowStatusId = resultWorkflowStatuses.InProgress
  if (validityStatus === 'Error') {
    resultWorkflowStatusId = resultWorkflowStatuses.Error
  } else if (['Aborted', 'User Stopped', 'Complete', 'Completed'].includes(resultStatus)) {
    resultWorkflowStatusId = resultWorkflowStatuses.Processed
  }
  const resultWorkflowLog = {
    resultId,
    resultWorkflowStatusId,
    operator,
    reason: `Data from ${labName}`,
    changedOn: utcNow,
    createdOn: utcNow,
  }
  let resultWorkflowStatusLogId = null
  const resultWorkflowStatusPriority = [
    resultWorkflowStatuses.Purged,
    resultWorkflowStatuses.Flagged,
    resultWorkflowStatuses.Acknowledged,
    resultWorkflowStatuses.Delivered,
    resultWorkflowStatuses.Deliverable,
    resultWorkflowStatuses.Validated,
    resultWorkflowStatuses.Error,
    resultWorkflowStatuses.Processed,
    resultWorkflowStatuses.InProgress,
    resultWorkflowStatuses.Ordered,
    resultWorkflowStatuses.OK,
  ]
  if (!currentResultWorkflowStatusLogId) {
    ;[resultWorkflowStatusLogId] = await knex('ResultWorkflowLog').insert(resultWorkflowLog)
    messageContext.dispatch(resultLogged(resultId, deviceLogId))
  } else {
    const existingResultWorkflowLog = await knex('ResultWorkflowLog')
      .where('id', currentResultWorkflowStatusLogId)
      .first()
    if (
      !existingResultWorkflowLog ||
      resultWorkflowStatusPriority.indexOf(resultWorkflowStatusId) <
        resultWorkflowStatusPriority.indexOf(existingResultWorkflowLog.resultWorkflowStatusId)
    ) {
      ;[resultWorkflowStatusLogId] = await knex('ResultWorkflowLog').insert(resultWorkflowLog)
      messageContext.dispatch(resultLogged(resultId, deviceLogId))
    }
  }
  if (resultWorkflowStatusLogId) {
    await knex('Result').where('id', resultId).update({ resultWorkflowStatusLogId })
  }
}

module.exports = TruenatResult
