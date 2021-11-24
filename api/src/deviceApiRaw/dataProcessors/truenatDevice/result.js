const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('@hapi/boom')
const {
  formatDateOrDefault,
  parseDateOrDefault,
} = require('../../../shared/date')
const { getRemoteAddress } = require('../../../shared/request')
const { SynchronousDataProcessor } = require('../_base')
const { postPayloadFromDevice } = require('../../../device/service')
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
    const path = _.get(params, 'params')
    return Promise.resolve(path === 'truelab/results/upload')
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    this.response = { deviceApiRawId: this.id, resultIds: [] }

    try {
      await transact(async knex => {
        const {
          deviceId,
          partnerId,
          siteId,
          geographyId,
          longitude,
          latitude,
          deviceDefaultReportableSiteId,
          siteExternalId,
          deviceTypeExternalId,
        } =
          (await knex('DeviceApiKey as dak')
            .join('Device as d', 'dak.deviceId', 'd.id')
            .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
            .join('Site as s', 'd.siteId', 's.id')
            .where('dak.token', auth.credentials.token)
            .first(
              'dak.deviceId',
              'd.partnerId',
              'd.siteId',
              's.geographyId',
              's.longitude',
              's.latitude',
              'd.defaultReportableSiteId as deviceDefaultReportableSiteId',
              's.externalId as siteExternalId',
              'dt.externalId as deviceTypeExternalId'
            )) || {}
        if (!deviceId) {
          throw Boom.badRequest(
            'Invalid device API key: Cannot determine which device this came from'
          )
        }
        const rawMessage = JSON.stringify(request.plugins.rawPayload)
        const utcNow = new Date()
        const resultSourceId = await resultSourceToId('DiagnosticDevice')
        const resultTypeId = await resultTypeToId('Patient')
        const resultCategoryIds = await allResultCategoryToId()
        const patientName = _.get(payload, 'PatientName')
        const patientId = _.get(payload, 'PatientID')
        const sampleTypeName = _.get(payload, 'SampleType')
        const sampleTypeIds = await allSampleTypeToId()
        const sampleTypeMappings = { Sputum: 'Sputum' }
        const sampleTypeId = sampleTypeMappings[sampleTypeName]
          ? sampleTypeIds[sampleTypeMappings[sampleTypeName]]
          : null
        const testName = _.get(payload, 'TestName')
        const assayExternalId =
          {
            MTB: 'assayTruenatMtb',
            'MTB Plus': 'assayTruenatMtbPlus',
            'MTB RIF': 'assayTruenatRif',
          }[testName] || 'assayTruenatUnknown'
        const assay = await knex('Assay')
          .where('externalId', assayExternalId)
          .first()
        const sampleExternalId = `${deviceTypeExternalId}_${
          assay.abbreviation
        }_${siteExternalId}_${patientId || patientName}_${
          sampleTypeMappings[sampleTypeName] || 'Unknown'
        }`
        let { id: sampleId } =
          (await knex('Sample')
            .where('externalId', sampleExternalId)
            .first('id')) || {}
        if (!sampleId) {
          ;[sampleId] = await knex('Sample').insert({
            externalId: sampleExternalId,
            sampleTypeId,
            originSiteId: deviceDefaultReportableSiteId,
          })
        }
        const resultExternalId = `${sampleExternalId}_${formatDateOrDefault(
          utcNow,
          'yyyyMMddhhmmss'
        )}`
        const patientAge = _.get(payload, 'Age')
        const patientGender = _.get(payload, 'Gender')
        const resultStatus = _.get(payload, 'Status')
        const finalResult = _.get(payload, 'FinalResult')
        const resultCategory1Id =
          assay.externalId === 'assayTruenatUnknown'
            ? resultCategoryIds.Unknown
            : {
                Positive: resultCategoryIds.Detected,
                Detected: resultCategoryIds.Detected,
                Negative: resultCategoryIds.NotDetected,
                'Not Detected': resultCategoryIds.NotDetected,
                Invalid: resultCategoryIds.Invalid,
                Indeterminate: resultCategoryIds.Indeterminate,
                Error: resultCategoryIds.Error,
              }[finalResult] || resultCategoryIds.Missing
        const validityStatus = _.get(payload, 'ValidityStatus')
        const senderOperator = _.get(payload, 'User')
        const labName = _.get(payload, 'LabName')
        const resultDetails = {
          partnerId,
          geographyId,
          siteId,
          deviceId,
          assayId: assay.id,
          longitude,
          latitude,
          resultSourceId,
          resultTypeId,
          patientData: JSON.stringify({
            doctorName: _.get(payload, 'DoctorName'),
            id: patientId,
            patientName,
            gender: patientGender,
            age: patientAge,
          }),
          resultData: JSON.stringify({
            finalResult,
            status: resultStatus,
            validityStatus,
            ctLabel1: _.get(payload, 'CtLabel1'),
            ct1: _.get(payload, 'Ct1'),
            ctResult1: _.get(payload, 'CtResult1'),
            ctLabel2: _.get(payload, 'CtLabel2'),
            ct2: _.get(payload, 'Ct2'),
            ctResult2: _.get(payload, 'CtResult2'),
            cLabel3: _.get(payload, 'CtLabel3'),
            ct3: _.get(payload, 'Ct3'),
            ctResult3: _.get(payload, 'CtResult3'),
            labName,
            testName,
          }),
          rawData: rawMessage,
          createdOn: utcNow,
          createdBy: null,
          updatedOn: utcNow,
          updatedBy: null,
          sampleId,
          externalId: resultExternalId,
          resultCategory1: resultCategory1Id || resultCategoryIds.Missing,
          senderOperator,
          notes: _.get(payload, 'Notes'),
        }
        const resultTime = parseDateOrDefault(
          `${_.get(payload, 'Date')} ${_.get(payload, 'Time')}`,
          { formatString: 'yyyy-MM-dd HH-mm-ss', backupDate: utcNow }
        )
        if (resultTime) {
          resultDetails.startedOn = resultTime
          if (['Complete', 'Aborted'].includes(resultStatus)) {
            resultDetails.endedOn = resultTime
          }
        }
        const result = {
          ...((await knex('Result')
            .where({ externalId: resultExternalId, deviceId })
            .orWhere({ sampleId, siteId, assayId: assay.id })
            .first()) || {}),
          ...resultDetails,
        }
        const resultWorkflowStatuses = await allResultWorkflowStatusToId()
        if (!result.id) {
          const [resultId] = await knex('Result').insert(result)
          result.id = resultId
        } else {
          await knex('Result').where('id', result.id).update(resultDetails)
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

        let resultWorkflowStatusId = resultWorkflowStatuses.InProgress
        if (validityStatus === 'Error') {
          resultWorkflowStatusId = resultWorkflowStatuses.Error
        } else if (
          ['Aborted', 'User Stopped', 'Complete'].includes(resultStatus)
        ) {
          resultWorkflowStatusId = resultWorkflowStatuses.Processed
        }
        const resultWorkflowLog = {
          resultId: result.id,
          resultWorkflowStatusId,
          senderOperator,
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
        if (!result.resultWorkflowStatusLogId) {
          ;[resultWorkflowStatusLogId] = await knex('ResultWorkflowLog').insert(
            resultWorkflowLog
          )
          this.messageContext.dispatch(resultLogged(result.id, deviceLogId))
        } else {
          const existingResultWorkflowLog = await knex('ResultWorkflowLog')
            .where('id', result.resultWorkflowStatusLogId)
            .first()
          if (
            !existingResultWorkflowLog ||
            resultWorkflowStatusPriority.indexOf(resultWorkflowStatusId) <
              resultWorkflowStatusPriority.indexOf(
                existingResultWorkflowLog.resultWorkflowStatusId
              )
          ) {
            ;[resultWorkflowStatusLogId] = await knex(
              'ResultWorkflowLog'
            ).insert(resultWorkflowLog)
            this.messageContext.dispatch(resultLogged(result.id, deviceLogId))
          }
        }
        if (resultWorkflowStatusLogId) {
          await knex('Result')
            .where('id', result.id)
            .update({ resultWorkflowStatusLogId })
        }
        this.messageContext.dispatch(deviceSeen(deviceId))
        this.response.resultExternalId = resultExternalId
      })
      this.response.success = true
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

module.exports = TruenatResult
