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
  astmE1394MessagesToJson,
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
    if (!payload) {
      throw Boom.badRequest('No payload to process')
    }
    const remoteAddress = getRemoteAddress(request)
    // TODO: Checksum validation
    // TODO: Error code mapping
    const sanitisedPayload = payload
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
      .join('\n')
    const jsonAstmMessages = astmE1394MessagesToJson(sanitisedPayload)
    const arrayFromPossibleRepeatedValue = (jsonAstmObject, path) =>
      _.get(jsonAstmObject, `${path}.items`)
        ? _.get(jsonAstmObject, `${path}.items`).map(i =>
            _.get(jsonAstmObject, `${path}.${i}`)
          )
        : _.isEmpty(_.get(jsonAstmObject, `${path}.value`))
        ? []
        : [_.get(jsonAstmObject, `${path}`)]
    const commentsFromJsonAstmRecord = jsonAstmRecord =>
      _.isEmpty(_.get(jsonAstmRecord, 'comments'))
        ? {}
        : {
            comments: _.get(jsonAstmRecord, 'comments').map(commentId => ({
              source: { I: 'Instrument' }[
                _.get(jsonAstmRecord, `${commentId}.3.value`)
              ],
              text: _.get(jsonAstmRecord, `${commentId}.4.value`),
              type: { G: 'Result Comment', I: 'Exception String' }[
                _.get(jsonAstmRecord, `${commentId}.5.value`)
              ],
            })),
          }
    const enquiriesFromJsonAstmRecord = jsonAstmRecord =>
      _.isEmpty(_.get(jsonAstmRecord, 'enquiries'))
        ? {}
        : {
            enquiries: _.get(jsonAstmRecord, 'enquiries').map(enquiryId => ({
              specimenId: _.get(jsonAstmRecord, `${enquiryId}.3.value`),
              assayCode: _.get(jsonAstmRecord, `${enquiryId}.5.value`),
              statusCode: { O: 'Orders' }[
                _.get(jsonAstmRecord, `${enquiryId}.13.value`)
              ],
            })),
          }
    const parsedResults = jsonAstmMessages.reduce((results, jsonAstmMessage) => {
      const abbottAstmMessage = {
        rawMessage: _.get(jsonAstmMessage, 'value'),
        sender: {
          nameOrId: _.get(jsonAstmMessage, 'H.4.1.value'),
          softwareVersion: _.get(jsonAstmMessage, 'H.4.2.value'),
          serialNumber: _.get(jsonAstmMessage, 'H.4.3.value'),
          interfaceVersion: _.get(jsonAstmMessage, 'H.4.4.value'),
        },
        typeOfMessage: {
          P: 'Production',
          D: 'Debugging',
          Q: 'Quality Control',
        }[_.get(jsonAstmMessage, 'H.11.value')],
        versionNo: _.get(jsonAstmMessage, 'H.12.value'),
        dateAndTime: dateParse(
          _.get(jsonAstmMessage, 'H.13.value'),
          'yyyyLLddHHmmss',
          utcNow
        ),
        messageIsComplete: _.get(jsonAstmMessage, 'L.2.value') === '1',
        ...commentsFromJsonAstmRecord(_.get(jsonAstmMessage, 'H')),
        ...enquiriesFromJsonAstmRecord(_.get(jsonAstmMessage, 'H')),
      }
      results = [
        ...results,
        ..._.get(jsonAstmMessage, 'H.patients').reduce((results, patientId) => {
          const jsonAstmPatient = _.get(jsonAstmMessage, `H.${patientId}`)
          const patient = {
            practicePatientId: _.get(jsonAstmPatient, '3.value'),
            laboratoryPatientId: _.get(jsonAstmPatient, '4.value'),
            patientIdNo3: _.get(jsonAstmPatient, '5.value'),
            patientName: _.get(jsonAstmPatient, '6.value'),
            dateOfBirth: dateParse(
              _.get(jsonAstmPatient, '8.value'),
              'yyyyLLdd',
              utcNow
            ),
            gender: { M: 'Male', F: 'Female', U: 'Unknown' }[
              _.get(jsonAstmPatient, '9.value')
            ],
            ethnicOrigin: _.get(jsonAstmPatient, '10.value'),
            patientAddress: _.get(jsonAstmPatient, '11.value'),
            patientPhone: _.get(jsonAstmPatient, '13.value'),
            attendingPhysician: _.get(jsonAstmPatient, '14.value'),
            patientHeight: _.get(jsonAstmPatient, '17.value'),
            patientWeight: _.get(jsonAstmPatient, '18.value'),
            patientDiagnoses: arrayFromPossibleRepeatedValue(
              jsonAstmPatient,
              '19'
            ).map(diagnosis => ({
              code: _.get(diagnosis, '1.value'),
              description: _.get(diagnosis, '2.value'),
            })),
            patientMedications: arrayFromPossibleRepeatedValue(
              jsonAstmPatient,
              '20'
            ).map(medication => ({
              name: _.get(medication, '1.value'),
              level: _.get(medication, '2.value'),
              startDate: _.get(medication, '3.value'),
              endDate: _.get(medication, '4.value'),
            })),
            patientDiet: _.get(jsonAstmPatient, '21.value'),
            admissionOrDischargeDates: _.get(jsonAstmPatient, '24.value'),
            admissionStatus: _.get(jsonAstmPatient, '25.value'),
            location: _.get(jsonAstmPatient, '26.value'),
            isolationStatus: _.get(jsonAstmPatient, '31.value'),
            hospitalInstitution: _.get(jsonAstmPatient, '34.value'),
            dosageCategory: _.get(jsonAstmPatient, '35.value'),
            ...commentsFromJsonAstmRecord(jsonAstmPatient),
          }
          results = [
            ...results,
            ..._.get(jsonAstmPatient, 'orders').reduce((results, orderId) => {
              const jsonAstmOrder = jsonAstmPatient[orderId]
              const order = {
                specimen: {
                  id: _.get(
                    jsonAstmOrder,
                    '3.1.value',
                    _.get(jsonAstmOrder, '3.value')
                  ),
                  locationId: _.get(jsonAstmOrder, '3.2.value'),
                  position: _.get(jsonAstmOrder, '3.3.value'),
                },
                instrumentSpecimen: {
                  id: _.get(
                    jsonAstmOrder,
                    '4.1.value',
                    _.get(jsonAstmOrder, '4.value')
                  ),
                  locationId: _.get(jsonAstmOrder, '4.2.value'),
                  position: _.get(jsonAstmOrder, '4.3.value'),
                },
                assay: {
                  code: _.get(jsonAstmOrder, '5.4.value'),
                  name: _.get(jsonAstmOrder, '5.5.value'),
                  protocol: _.get(jsonAstmOrder, '5.6.value'),
                  testQualifier: { P: 'Primary', C: 'Correlation' }[
                    _.get(jsonAstmOrder, '5.7.value')
                  ],
                },
                priority: { S: 'STAT', R: 'Routine' }[
                  _.get(jsonAstmOrder, '6.value')
                ],
                requestTime: dateParse(
                  _.get(jsonAstmOrder, '7.value'),
                  'yyyyLLddHHmmss',
                  utcNow
                ),
                collectionTime: dateParse(
                  _.get(jsonAstmOrder, '8.value'),
                  'yyyyLLddHHmmss',
                  utcNow
                ),
                collectorId: _.get(jsonAstmOrder, '11.value'),
                actionCode: {
                  C: 'Cancel Test Order',
                  A: 'Add Test to Order',
                  N: 'New Test Order',
                  Q: 'Quality Control Result',
                  '': 'Patient Result',
                }[_.get(jsonAstmOrder, '12.value')],
                reportType: {
                  F: 'Final Result',
                  X: 'Test could not be performed',
                }[_.get(jsonAstmOrder, '26.value')],
                ...commentsFromJsonAstmRecord(jsonAstmOrder),
              }
              results = [
                ...results,
                ..._.get(jsonAstmOrder, 'results').reduce(
                  (results, resultId) => {
                    const jsonAstmResult = jsonAstmOrder[resultId]
                    const result = {
                      assay: {
                        code: _.get(jsonAstmResult, '3.4.value'),
                        name: _.get(jsonAstmResult, '3.5.value'),
                        protocol: _.get(jsonAstmResult, '3.6.value'),
                        status: { P: 'Primary', C: 'Correlation' }[
                          _.get(jsonAstmResult, '3.7.value')
                        ],
                      },
                      consumable: {
                        reagentLot: _.get(jsonAstmResult, '3.8.value'),
                        reagentSerialNumber: _.get(jsonAstmResult, '3.9.value'),
                        controlLotNumber: _.get(jsonAstmResult, '3.10.value'),
                      },
                      type: {
                        F: 'Final Result',
                        P: 'Preliminary Result',
                        I: 'Interpretation of Final Result',
                      }[_.get(jsonAstmResult, '3.11.value')],
                      text: _.get(jsonAstmResult, '4.value'),
                      unit: _.get(jsonAstmResult, '5.value'),
                      referenceRanges: _.get(jsonAstmResult, '6.value'),
                      abnormalFlags: arrayFromPossibleRepeatedValue(
                        jsonAstmResult,
                        '7'
                      ).map(abnormalFlag => _.get(abnormalFlag, 'value')),
                      status: {
                        F: 'Final Result',
                        R: 'Previously Transmitted Result',
                      }[_.get(jsonAstmResult, '9.value')],
                      operators: {
                        orderOperatorId: _.get(jsonAstmResult, '11.1.value'),
                        releaseOperatorId: _.get(jsonAstmResult, '11.2.value'),
                      },
                      completedOn: dateParse(
                        _.get(jsonAstmResult, '13.value'),
                        'yyyyLLddHHmmss',
                        utcNow
                      ),
                      moduleSerial: _.get(jsonAstmResult, '14.2.value'),
                      comments: [],
                      ...commentsFromJsonAstmRecord(jsonAstmResult),
                    }
                    results = [
                      ...results,
                      {
                        message: abbottAstmMessage,
                        patient,
                        order,
                        result,
                      },
                    ]
                    return results
                  },
                  []
                ),
              ]
              return results
            }, []),
          ]
          return results
        }, []),
      ]
      return results
    }, [])
    const m2000AspectAssayCodeMapping = {
      '1mLDBSvOP': 'abbottM2000HivVL',
      'HIV0.6ml': 'abbottM2000HivVL',
      'HIVQLDRDBS': 'abbottM2000HIVEID',
    }
    const unknownAssayCodes = parsedResults.map(parsedResult => _.get(parsedResult, 'result.assay.code')).filter(assayCode => !Object.keys(m2000AspectAssayCodeMapping).includes(assayCode))
    if(!_.isEmpty(unknownAssayCodes)) {
      throw Boom.badRequest(`Unknown assay codes: ${unknownAssayCodes.join(', ')}`)
    }
    await transact(async knex => {
      const { deviceId } = await knex('DeviceApiKey')
        .where('token', auth.credentials.token)
        .first('deviceId')
      if (!deviceId) {
        throw Boom.badRequest(
          'Invalid device API key: Cannot determine which device this came from'
        )
      }
      this.response.deviceId = deviceId
      const [deviceLogId] = await knex('DeviceLog').insert({
        deviceId,
        source: _.get(payload, 'log.source', ''),
        createdOn: utcNow,
        senderIp: remoteAddress,
        rawMessage: JSON.stringify(request.plugins.rawPayload),
      })

      this.response.deviceLogId = deviceLogId
      await knex('Device')
        .where({ id: deviceId })
        .update({ lastSeenOn: utcNow, updatedOn: utcNow })
      this.messageContext.dispatch(deviceSeen(deviceId))

      await Promise.each(parsedResults, await parsedResult => {
        const m2000AspectAssayCodeMapping = {

        }
        const assayId = await assayToId(
          mgitResultTypeCode === 'AST_MGIT' ? 'assayBdMgitAst' : 'assayBdMgitGnd'
        )

      })

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
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = DefaultAbbottM2000
