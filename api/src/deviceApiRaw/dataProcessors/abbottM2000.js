const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')
const dateParse = require('date-fns/parse')
const { knex, transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const { getUtcTime } = require('../../shared/date')
const {
  getAllStringsEnclosedBetweenCharacters,
  stringContains,
} = require('../../shared/string')
const {
  getAstmField,
  locateAstmE1394Value,
  getNumberOfAstmE1394Children,
} = require('../../shared/astm')
const { deviceSeen } = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')

const {
  assayToId,
  resultTypeToId,
  resultSourceToId,
  resultCategoryToId,
  resultWorkflowStatusToId,
} = require('../../shared/dictionary')

class DefaultAbbottM2000 extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static containsM2000AstmLineHeader(line) {
    return /a?S'\dH.{7,14}m2000.{1,2}\d*\.\d*\.\d*\.\d*.*\\r\\n'/.test(line)
  }

  static async canProcessRequest(request) {
    const { payload } = request
    return (
      payload.trim().startsWith('(lp1\n(lp2\n') &&
      payload.trim().endsWith('\naa.') &&
      DefaultAbbottM2000.containsM2000AstmLineHeader(payload)
    )
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    const utcNow = getUtcTime()
    this.response = { deviceApiRawId: this.id }
    // TODO: Collect multiple patient, order, result & comments in a single message
    // TODO: Checksum validation
    // TODO: Error code mapping
    this.results = payload
      .replace(/\\\\/g, '\\')
      .split('\n')
      .reduce((resultRawMessages, rawLine) => {
        if (rawLine) {
          const line = getAllStringsEnclosedBetweenCharacters(rawLine, "'")
            .map(quotedLine => quotedLine.replace(/^\d(H|P|O|Q|C|R|L)?/, '$1'))
            .shift()
          if (DefaultAbbottM2000.containsM2000AstmLineHeader(rawLine)) {
            resultRawMessages = [...resultRawMessages, line]
          } else if (line && resultRawMessages.length) {
            resultRawMessages[resultRawMessages.length - 1] += `\n${line}`
          }
        }
        return resultRawMessages
      }, [])
      .map(raw => {
        const delimitersString = raw.substr(raw.indexOf('H') + 1, 4)
        const delimiters = {
          fieldDelimiter: delimitersString[0], // |
          repeatDelimiter: delimitersString[1], // \
          componentDelimiter: delimitersString[2], // ^
          escapeDelimiter: delimitersString[3], // &
        }
        const abbottAstmMessage = {
          rawMessage: raw,
          sender: {
            nameOrId: getAstmField(raw, 'H,5,1,1', delimiters),
            softwareVersion: getAstmField(raw, 'H,5,1,2', delimiters),
            serialNumber: getAstmField(raw, 'H,5,1,3', delimiters),
            interfaceVersion: getAstmField(raw, 'H,5,1,4', delimiters),
          },
          typeOfMessage: {
            P: 'Production',
            D: 'Debugging',
            Q: 'Quality Control',
          }[getAstmField(raw, 'H,12,1,1', delimiters)],
          versionNo: getAstmField(raw, 'H,13,1,1', delimiters),
          dateAndTime: dateParse(
            getAstmField(raw, 'H,14,1,1', delimiters),
            'yyyyLLddHHmmss',
            utcNow
          ),
          patients: [],
          messageIsComplete: getAstmField(raw, 'L,2,1,1', delimiters) === '1',
        }
        const numberOfPatientsInMessage = getNumberOfAstmE1394Children(
          raw,
          'H',
          'P',
          delimiters
        )
        for (let p = 0; p < numberOfPatientsInMessage; p++) {
          const patientRecordPath = `H.P${p + 1}`
          const getPatientRecordValue = fieldNumber =>
            locateAstmE1394Value(
              raw,
              patientRecordPath,
              fieldNumber,
              null,
              null,
              delimiters
            )
          const patient = {
            practicePatientId: getPatientRecordValue(3),
            laboratoryPatientId: getPatientRecordValue(4),
            patientIdNo3: getPatientRecordValue(5),
            patientName: getPatientRecordValue(6),
            dateOfBirth: dateParse(
              getPatientRecordValue(7),
              'yyyyLLdd',
              utcNow
            ),
            gender: { M: 'Male', F: 'Female', U: 'Unknown' }[
              getPatientRecordValue(8)
            ],
            doctor: getPatientRecordValue(9),
            location: getPatientRecordValue(10),
            testOrders: [],
          }
          const numberOfOrdersForPatient = getNumberOfAstmE1394Children(
            raw,
            patientRecordPath,
            'O',
            delimiters
          )
          for (let o = 0; o < numberOfOrdersForPatient; o++) {
            const testOrderRecordPath = `${patientRecordPath}.O${o + 1}`
            const getTestOrderRecordValue = (fieldNumber, componentNumber) =>
              locateAstmE1394Value(
                raw,
                testOrderRecordPath,
                fieldNumber,
                null,
                componentNumber,
                delimiters
              )
            const testOrder = {
              specimenId: getTestOrderRecordValue(3, 1),
              instrumentIds: {
                specimen: getTestOrderRecordValue(4, 1),
                carousel: getTestOrderRecordValue(4, 2),
                position: getTestOrderRecordValue(4, 3),
              },
              assay: {
                code: getTestOrderRecordValue(5, 4),
                name: getTestOrderRecordValue(5, 5),
                protocol: getTestOrderRecordValue(5, 6),
                status: { P: 'Primary', C: 'Correlation' }[
                  getTestOrderRecordValue(5, 7)
                ],
              },
              priority: { S: 'STAT', R: 'Routine' }[
                getTestOrderRecordValue(6, 1)
              ],
              collectionTime: dateParse(
                getTestOrderRecordValue(7, 1),
                'yyyyLLddHHmmss',
                utcNow
              ),
              actionCode: { Q: 'Quality Control Result', '': 'Patient Result' }[
                getTestOrderRecordValue(8, 1)
              ],
              reportType: {
                F: 'Final Result',
                X: 'Test could not be performed',
              }[getTestOrderRecordValue(9, 1)],
              results: [],
              comments: [],
            }
            const numberOfCommentsForTestOrder = getNumberOfAstmE1394Children(
              raw,
              testOrderRecordPath,
              'C',
              delimiters
            )
            for (let toc = 0; toc < numberOfCommentsForTestOrder; toc++) {
              const testOrderCommentRecordPath = `${testOrderRecordPath}.C${toc +
                1}`
              const getTestOrderCommentRecordValue = fieldNumber =>
                locateAstmE1394Value(
                  raw,
                  testOrderCommentRecordPath,
                  fieldNumber,
                  null,
                  null,
                  delimiters
                )
              const testOrderComment = {
                source: { I: 'Instrument' }[getTestOrderCommentRecordValue(3)],
                text: getTestOrderCommentRecordValue(4),
                type: { G: 'Result Comment', I: 'Exception String' }[
                  getTestOrderCommentRecordValue(5)
                ],
              }
              testOrder.comments = [...testOrder.comments, testOrderComment]
            }
            const numberOfResultsForTestOrder = getNumberOfAstmE1394Children(
              raw,
              testOrderRecordPath,
              'R',
              delimiters
            )
            for (let r = 0; r < numberOfResultsForTestOrder; r++) {
              const resultRecordPath = `${testOrderRecordPath}.O${o + 1}`
              const getResultRecordValue = (fieldNumber, componentNumber) =>
                locateAstmE1394Value(
                  raw,
                  resultRecordPath,
                  fieldNumber,
                  null,
                  componentNumber,
                  delimiters
                )
              const result = {
                consumable: {
                  code: getResultRecordValue(3, 4),
                  name: getResultRecordValue(3, 5),
                  protocol: getResultRecordValue(3, 6),
                  status: { P: 'Primary', C: 'Correlation' }[
                    getResultRecordValue(3, 7)
                  ],
                  reagentLotNo: getResultRecordValue(3, 8),
                  reagentSerialNo: getResultRecordValue(3, 9),
                  controlLotNo: getResultRecordValue(3, 10),
                  resultType: {
                    F: 'Final Result',
                    P: 'Preliminary Result',
                    I: 'Interpretation of Final Result',
                  }[getResultRecordValue(3, 11)],
                },
                text: getResultRecordValue(4, 1),
                unit: getResultRecordValue(5, 1),
                referenceRanges: getResultRecordValue(6, 1),
                abnormalFlags: getResultRecordValue(7, 1),
                status: {
                  F: 'Final Result',
                  R: 'Previously Transmitted Result',
                }[getResultRecordValue(8, 1)],
                operators: {
                  orderOperatorId: getResultRecordValue(9, 1),
                  releaseOperatorId: getResultRecordValue(4, 2),
                },
                completedOn: dateParse(
                  getResultRecordValue(10, 1),
                  'yyyyLLddHHmmss',
                  utcNow
                ),
                moduleSerial: getResultRecordValue(11, 1),
                comments: [],
              }
              const numberOfCommentsForResult = getNumberOfAstmE1394Children(
                raw,
                resultRecordPath,
                'C',
                delimiters
              )
              for (let rc = 0; rc < numberOfCommentsForResult; rc++) {
                const resultCommentRecordPath = `${resultRecordPath}.C${rc + 1}`
                const getResultCommentRecordValue = fieldNumber =>
                  locateAstmE1394Value(
                    raw,
                    resultCommentRecordPath,
                    fieldNumber,
                    null,
                    null,
                    delimiters
                  )
                const resultComment = {
                  source: { I: 'Instrument' }[getResultCommentRecordValue(3)],
                  text: getResultCommentRecordValue(4),
                  type: { G: 'Result Comment', I: 'Exception String' }[
                    getResultCommentRecordValue(5)
                  ],
                }
                result.comments = [...result.comments, resultComment]
              }
              testOrder.results = [...testOrder.results, result]
            }
            patient.testOrders = [...patient.testOrders, testOrder]
          }
          abbottAstmMessage.patients = [...abbottAstmMessage.patients, patient]
        }
        return abbottAstmMessage
      })
    /*
    await transact(async knex => {
      const { deviceId } = await knex('DeviceApiKey')
        .where('token', auth.credentials.token)
        .first('deviceId')
      const remoteAddress = getRemoteAddress(request)
      if (!deviceId) {
        throw Boom.badRequest(
          'Invalid device API key: Cannot determine which device this came from'
        )
      }

      this.response.deviceId = deviceId

      const utcNow = getUtcTime()

      const [deviceLogId] = await knex('DeviceLog').insert({
        deviceId,
        source: _.get(payload, 'log.source', ''),
        createdOn: utcNow,
        senderIp: remoteAddress,
        // TODO: DeviceLog handle non-JSON payloads
        rawMessage: JSON.stringify(request.plugins.rawPayload),
      })

      this.response.deviceLogId = deviceLogId

      await knex('Device')
        .where({ id: deviceId })
        .update({ lastSeenOn: utcNow, updatedOn: utcNow })
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

      if (
        mgitResultTypeCode !== 'GND_MGIT' &&
        mgitResultTypeCode !== 'AST_MGIT'
      ) {
        throw Boom.badRequest(`Unknown result type: ${mgitResultTypeCode}`)
      }

      const assayId = await assayToId(
        mgitResultTypeCode === 'AST_MGIT' ? 'assayBdMgitAst' : 'assayBdMgitGnd'
      )

      // Use test status to determine workflow status and result category 1:
      const mgitTestStatus = getAstmField(astm, 'R,4,1,1')
      let resultCategory1 = null
      let resultWorkflowStatusId = null

      switch (mgitTestStatus) {
        case 'INST_POSITIVE':
          resultCategory1 = await resultCategoryToId('Detected')
          resultWorkflowStatusId = await resultWorkflowStatusToId('Processed')
          break
        case 'INST_NEGATIVE':
          resultCategory1 = await resultCategoryToId('NotDetected')
          resultWorkflowStatusId = await resultWorkflowStatusToId('Processed')
          break
        case 'INST_COMPLETE':
          resultCategory1 = await resultCategoryToId('Success')
          resultWorkflowStatusId = await resultWorkflowStatusToId('Processed')
          break
        case 'INST_REMOVED':
          resultCategory1 = await resultCategoryToId('Missing')
          resultWorkflowStatusId = await resultWorkflowStatusToId('Purged')
          break
        case 'INST_ERROR':
          resultCategory1 = await resultCategoryToId('Error')
          resultWorkflowStatusId = await resultWorkflowStatusToId('Error')
          break
        case 'INST_ONGOING':
        default:
          resultCategory1 = await resultCategoryToId('Unknown')
          resultWorkflowStatusId = await resultWorkflowStatusToId('InProgress')
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
        .first(
          's.id',
          's.partnerId',
          's.geographyId',
          's.longitude',
          's.latitude'
        )

      const device = await knex('Device')
        .where('id', deviceId)
        .first()

      // It is possible that a single plastic carrier could be used more than once for a particular access number.
      // The test start date/time, with the sequence number, uniquely identifies a test and its result.
      const externalId = `${mgitStartedOn}_${mgitConsumableSequenceNumber}`
      const result = await knex('Result')
        .where('deviceId', deviceId)
        .where('externalId', externalId)
        .first()

      // build up result data field:
      const resultData = {
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
        assayId,
        partnerId: device.partnerId,
        geographyId: site ? site.geographyId : null,
        siteId: site ? site.id : null,
        deviceId,
        longitude: site ? site.longitude : null,
        latitude: site ? site.latitude : null,
        resultSourceId,
        resultTypeId,
        resultCategory1,
        resultCategory2,
        startedOn: dateParse(mgitStartedOn, 'yyyyLLddHHmmss', utcNow),
        endedOn: mgitEndedOn
          ? dateParse(mgitEndedOn, 'yyyyLLddHHmmss', utcNow)
          : null,
        consumableSerial: mgitConsumableSequenceNumber,
        senderVersion: mgitVersionNumber,
        updatedOn: utcNow,
        resultData: JSON.stringify(resultData),
      }

      // add/update sample
      const sampleFields = {
        externalId: mgitAccessionNumber,
        originSiteId: site ? site.id : null,
      }

      // Insert or update result
      let resultId = null
      if (result) {
        // update sample
        await knex('Sample')
          .where('id', result.sampleId)
          .update(sampleFields)

        // update result
        await knex('Result')
          .where('deviceId', deviceId)
          .where('externalId', externalId)
          .update(resultFields)

        resultId = result.id
      } else {
        // insert sample
        const sampleId = await knex('Sample').insert(sampleFields)

        // insert result
        ;[resultId] = await knex('Result').insert(
          Object.assign(resultFields, {
            deviceId,
            externalId,
            sampleId,
            createdOn: utcNow,
          })
        )
      }

      // Save workflow status
      let newStatus = false
      if (result && result.resultWorkflowStatusLogId) {
        const log = await knex('ResultWorkflowLog').where(
          'id',
          result.resultWorkflowStatusLogId
        )

        newStatus = log.resultWorkflowStatusId !== resultWorkflowStatusId
      }

      if (newStatus || !result || !result.resultWorkflowStatusLogId) {
        const logId = await knex('ResultWorkflowLog').insert({
          resultId,
          resultWorkflowStatusId,
          changedOn: utcNow,
          createdOn: utcNow,
        })

        await knex('Result')
          .where('id', resultId)
          .update('resultWorkflowStatusLogId', logId)
      }

      await knex('DeviceLog')
        .where('id', deviceLogId)
        .update({ resultId })
    })
    */
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = DefaultAbbottM2000
