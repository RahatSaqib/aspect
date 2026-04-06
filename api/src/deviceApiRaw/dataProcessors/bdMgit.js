const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex, transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const { parseDateOrDefault } = require('../../shared/date')
const { getAstmField } = require('../../shared/astm')
const { deviceSeen } = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')

const { allAssayToId, resultTypeToId, resultSourceToId, resultCategoryToId } = require('../../shared/dictionary')

class DefaultBDMGIT extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static async canProcessRequest(request) {
    const { auth } = request
    if (!_.get(auth, 'credentials.token')) {
      return false
    }
    const { externalId: deviceTypeId } =
      (await knex('DeviceApiKey as dak')
        .join('Device as d', 'dak.deviceId', 'd.id')
        .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where('dak.token', auth.credentials.token)
        .first('dt.externalId')) || {}
    return deviceTypeId === 'BDMGIT'
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request

    this.response = { deviceApiRawId: this.id }
    await transact(async knex => {
      const { id: deviceApiKeyId, deviceId } = await knex('DeviceApiKey')
        .where('token', auth.credentials.token)
        .first('id', 'deviceId')
      const remoteAddress = getRemoteAddress(request)
      if (!deviceId) {
        throw Boom.badRequest('Invalid device API key: Cannot determine which device this came from')
      }

      this.response.deviceId = deviceId

      const now = new Date()

      const [deviceLogId] = await knex('DeviceLog').insert({
        deviceApiKeyId,
        source: _.get(payload, 'log.source', ''),
        createdOn: now,
        senderIp: remoteAddress,
        // TODO: DeviceLog handle non-JSON payloads
        rawMessage: JSON.stringify(request.plugins.rawPayload),
      })

      this.response.deviceLogId = deviceLogId

      await knex('Device').where({ id: deviceId }).update({ lastSeenOn: now, updatedOn: now })
      this.messageContext.dispatch(deviceSeen(deviceId))

      if (!this.request.payload) {
        throw Boom.badRequest('No payload to process')
      }

      // reconstruct ASTM message:
      const astm = `${this.request.payload.header}\n${this.request.payload.body}`

      // NOTE: BACTEC MGIT 960 does not support patient information and therefore always transmits an empty Patient record.

      // specimen’s assigned sequence number (barcode) that is always 12 digits.
      const mgitConsumableSequenceNumber = getAstmField(astm, 'R,3,1,5')

      // Use result type code to determine assay ID
      // GND_MGIT for growth and Detection specimens or AST_MGIT for AST sets
      // For those new to MGIT & TB diagnostics:
      //   - GND_MGIT is an assay used to detect the presence & concentration of TB
      //   - AST_MGIT is an assay used to detect the resistance/susceptibility to various sets of antibiotics
      const mgitResultTypeCode = getAstmField(astm, 'R,3,1,4')

      if (mgitResultTypeCode !== 'GND_MGIT' && mgitResultTypeCode !== 'AST_MGIT') {
        throw Boom.badRequest(`Unknown result type: ${mgitResultTypeCode}`)
      }

      const allAssayIds = await allAssayToId()
      const assayIds =
        mgitResultTypeCode === 'AST_MGIT'
          ? [allAssayIds.assayBdMgitAst, allAssayIds.assayGenericDst].filter(a => !!a)
          : [allAssayIds.assayBdMgitGnd, allAssayIds.assayGenericCulture].filter(a => !!a)
      if (_.isEmpty(assayIds)) {
        throw Boom.notImplemented(
          `No supported assays exist for ${mgitResultTypeCode} BD MGIT results on this instance of Aspect`
        )
      }
      // Use test status to determine result category 1:
      const mgitTestStatus = getAstmField(astm, 'R,4,1,1')
      let resultCategory1 = null

      switch (mgitTestStatus) {
        case 'INST_POSITIVE':
          resultCategory1 = await resultCategoryToId('Detected')
          break
        case 'INST_NEGATIVE':
          resultCategory1 = await resultCategoryToId('NotDetected')
          break
        case 'INST_COMPLETE':
          resultCategory1 = await resultCategoryToId('Success')
          break
        case 'INST_REMOVED':
          resultCategory1 = await resultCategoryToId('Missing')
          break
        case 'INST_ERROR':
          resultCategory1 = await resultCategoryToId('Error')
          break
        case 'INST_ONGOING':
        default:
          resultCategory1 = await resultCategoryToId('Unknown')
          break
      }

      // accessionNumber = sample ID
      const mgitAccessionNumber = getAstmField(astm, 'O,3,1,1')
      const mgitStartedOn = getAstmField(astm, 'R,12,1,1')
      const mgitEndedOn = getAstmField(astm, 'R,13,1,1')
      const mgitVersionNumber = getAstmField(astm, 'H,13,1,1')

      const resultSourceId = await resultSourceToId('DiagnosticDevice')
      const resultTypeId = await resultTypeToId('Patient')
      const site = await knex('Site as s')
        .join('Device as d', 's.id', 'd.siteId')
        .where('d.id', deviceId)
        .first('s.id', 's.partnerId', 's.geographyId', 's.longitude', 's.latitude')

      const device = await knex('Device').where('id', deviceId).first()

      // add/update sample
      const sampleFields = {
        externalId: mgitAccessionNumber || null,
        originSiteId: site ? site.id : null,
        updatedOn: now,
      }
      const existingSample = await knex('Sample').where('externalId', sampleFields.externalId).first()
      let sampleId = null
      if (existingSample) {
        sampleId = existingSample.id
        // update sample
        await knex('Sample').where('id', existingSample.id).update(sampleFields)
      } else {
        // insert sample
        ;[sampleId] = await knex('Sample').insert({ ...sampleFields, createdOn: now })
      }

      // It is possible that a single plastic carrier could be used more than once for a particular access number.
      // The test start date/time, with the sequence number, uniquely identifies a test and its result.
      const externalId = `${mgitStartedOn}_${mgitConsumableSequenceNumber}`
      const result = await knex('Result')
        .where(function () {
          this.where('deviceId', deviceId).andWhere('externalId', externalId)
        })
        .orWhere(function () {
          this.where('sampleId', sampleId).whereIn('assayId', assayIds).andWhere('siteId', site.id)
        })
        .first()
      // build up result data field:
      const resultData = {
        ...JSON.parse(_.get(result, 'resultData', '{}')),
        senderName: getAstmField(astm, 'H,5,1,1'),
        versionNumber: mgitVersionNumber,
        messageDateTime: getAstmField(astm, 'H,14,1,1'),
        accessionNumber: mgitAccessionNumber,
        isolateNumber: getAstmField(astm, 'O,3,1,2'),
        testId: getAstmField(astm, 'O,5,1,4'),
        resultTypeCode: mgitResultTypeCode,
        consumableSequenceNumber: mgitConsumableSequenceNumber,
        preliminaryFinalStatus: getAstmField(astm, 'R,9,1,1'),
        testStartDateTime: mgitStartedOn,
        testEndedDateTime: mgitEndedOn,
        instrumentType: getAstmField(astm, 'R,14,1,1'),
        protocolLength: getAstmField(astm, 'R,14,1,3'),
        instrumentNumber: getAstmField(astm, 'R,14,1,4'),
        instrumentLocation: getAstmField(astm, 'R,14,1,5'),
      }

      // while
      let i = 1
      let antibiotic = null
      let susceptible = null
      let resultCategory2 = null

      // TODO: Consider NOT treating these results part of a "lower level schema section". Could be top-level properties like "firSirStatus", "rifAntibioticConcentration" instead
      // eslint-disable-next-line no-cond-assign
      while ((antibiotic = getAstmField(astm, `R,3,${i},6`))) {
        // The BACTEC MGIT 960 instrument transmits an ‘S’ for susceptible, ‘I’ for Indeterminate (not currently used), or an ‘R’ for resistant.
        const sirStatus = getAstmField(astm, `R,4,${i},3`)
        if (sirStatus === 'S') {
          susceptible = true
        }

        resultData[antibiotic] = {
          sirStatus,
          antibioticConcentration: getAstmField(astm, `R,3,${i},7`),
          antibioticConcentrationUnits: getAstmField(astm, `R,3,${i},8`),
          growthUnits: getAstmField(astm, `R,4,${i},2`),
        }
        i += 1
      }

      // Use SIR status to determine result category 2:
      if (mgitResultTypeCode === 'AST_MGIT' && susceptible !== null) {
        if (susceptible) {
          resultCategory2 = await resultCategoryToId('Susceptible')
        } else {
          resultCategory2 = await resultCategoryToId('Resistant')
        }
      }

      // add/update result
      const resultFields = {
        assayId: assayIds[0],
        partnerId: device.partnerId,
        siteId: site ? site.id : null,
        deviceId,
        longitude: site ? site.longitude : null,
        latitude: site ? site.latitude : null,
        resultSourceId,
        resultTypeId,
        resultCategory1,
        resultCategory2,
        startedOn:
          parseDateOrDefault(mgitStartedOn, {
            formatString: 'yyyyMMddHHmmss',
          }) || _.get(result, 'startedOn'),
        endedOn:
          parseDateOrDefault(mgitEndedOn, {
            formatString: 'yyyyMMddHHmmss',
          }) || _.get(result, 'endedOn'),
        consumableSerial: mgitConsumableSequenceNumber,
        senderVersion: mgitVersionNumber,
        updatedOn: now,
        resultData: JSON.stringify(resultData),
        reportableSiteId: device.defaultReportableSiteId || device.siteId,
      }

      // Insert or update result
      let resultId = null
      if (result) {
        // update result
        await knex('Result').where('id', result.id).update(resultFields)

        resultId = result.id
      } else {
        // insert result
        ;[resultId] = await knex('Result').insert(
          Object.assign(resultFields, {
            deviceId,
            externalId,
            sampleId,
            createdOn: now,
          })
        )
      }

      await knex('DeviceLog').where('id', deviceLogId).update({ resultId })
    })
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = DefaultBDMGIT
