const _ = require('lodash')
const Promise = require('bluebird')
const { getRemoteAddress } = require('../../shared/request')
const { SynchronousDataProcessor } = require('./_base')

class PhilippinesNtrlDatabase extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.timeoutMilliseconds = 60000
    this.response = {}
  }

  static isRequestFromNtrlDatabase(request, expectedKeys, databasePrefix, signOffViewName) {
    const { payload } = request
    if (!payload) {
      return false
    }
    const payloadKeys = Object.keys(payload)
    return (
      expectedKeys.every(expectedKey => payloadKeys.includes(expectedKey)) &&
      (payload.database.startsWith(databasePrefix) || payload.table.startsWith(signOffViewName))
    )
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }

  async upsertResult(
    knex,
    rawMessage,
    site,
    result,
    resultCategory1Id,
    resultCategory2Id,
    newResultData,
    resultSignOff,
    resultStartedOn,
    resultEndedOn,
    operator,
    remarks,
    patientData,
    utcNow,
    resultCategories,
    resultOverwritePriority
  ) {
    const mergeDeep = (baseValue, sourceValue) => {
      if (_.isEmpty(baseValue) && !_.isEmpty(sourceValue)) {
        return sourceValue
      }
      if (!_.isEmpty(baseValue) && _.isEmpty(sourceValue)) {
        return baseValue
      }
      if (_.isArray(baseValue) && _.isArray(sourceValue)) {
        return _.uniq([...(baseValue || []), ...(sourceValue || [])])
      }
      if (_.isPlainObject(baseValue) && _.isPlainObject(sourceValue)) {
        const mergedValue = {
          ...baseValue,
        }
        Object.keys(sourceValue).forEach(sourceValueKey => {
          mergedValue[sourceValueKey] = mergeDeep(mergedValue[sourceValueKey], sourceValue[sourceValueKey])
        })
        return mergedValue
      }
      return sourceValue || baseValue
    }
    if (!result.resultCategory1) {
      result.resultCategory1 = resultCategories.Missing
    }
    if (!result.resultCategory2) {
      result.resultCategory2 = resultCategories.Missing
    }
    if (resultOverwritePriority.indexOf(resultCategory1Id) < resultOverwritePriority.indexOf(result.resultCategory1)) {
      result.resultCategory1 = resultCategory1Id
    }
    if (resultOverwritePriority.indexOf(resultCategory2Id) < resultOverwritePriority.indexOf(result.resultCategory2)) {
      result.resultCategory2 = resultCategory2Id
    }
    if (remarks && (!result.notes || !result.notes.includes(remarks.trim()))) {
      if (!result.notes) {
        result.notes = ''
      } else {
        result.notes += '\n'
      }
      result.notes += remarks
    }
    if (result.id) {
      if (!result.siteId) {
        result.siteId = site.id
      }
      if (site.longitude) {
        result.longitude = site.longitude
      }
      if (site.latitude) {
        result.latitude = site.latitude
      }
      if (!result.startedOn) {
        result.startedOn = resultStartedOn
      }
      if (!result.endedOn) {
        result.endedOn = resultEndedOn
      }
      const resultData = mergeDeep(JSON.parse(result.resultData || '{}'), {
        ...newResultData,
        resultSignOff,
      })
      result.resultData = JSON.stringify(resultData)
      const resultPatientData = JSON.parse(result.patientData || '{}')
      result.patientData = JSON.stringify(mergeDeep(resultPatientData, patientData))
      if (result.rawData && result.rawData.indexOf(rawMessage) === -1) {
        result.rawData += `\n${rawMessage}`
      } else if (!result.rawData) {
        result.rawData = rawMessage
      }
      result.updatedOn = utcNow
      result.updatedBy = null
    }
    if (!result.id) {
      const [resultId] = await knex('Result').insert(result)
      result.id = resultId
    } else {
      await knex('Result').where('id', result.id).update(result)
    }
    await this.appendDeviceLog(knex, result.deviceId, result.id, rawMessage, utcNow)
    this.response.resultIds = [...this.response.resultIds, result.id]
  }

  async appendDeviceLog(knex, deviceId, resultId, rawMessage, utcNow) {
    const remoteAddress = getRemoteAddress(this.request)
    const [deviceLogId] = await knex('DeviceLog').insert({
      deviceApiKeyId: knex('Device').where('id', deviceId).first('deviceApiKeyId'),
      resultId,
      source: 'Philippines NTRL DB Record Updated',
      createdOn: utcNow,
      senderIp: remoteAddress,
      rawMessage,
    })
    if (_.isNil(this.response.deviceLogIds)) {
      this.response.deviceLogIds = []
    }
    this.response.deviceLogIds = [...this.response.deviceLogIds, deviceLogId]
    return deviceLogId
  }

  getResultSignOff(testType, payload) {
    return {
      laboratoryTechnician: payload[`${testType}SignedOffBy1`],
      laboratorySupervisor: payload[`${testType}SignedOffBy2`],
      laboratoryManager: payload[`${testType}SignedOffBy3`],
    }
  }
}

module.exports = PhilippinesNtrlDatabase
