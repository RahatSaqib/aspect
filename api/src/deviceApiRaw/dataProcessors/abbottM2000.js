const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('@hapi/boom')
const { convertToTimeZone } = require('date-fns-timezone')
const { transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const {
  getUtcTime,
  parseDateOrDefault,
  dateEqual,
} = require('../../shared/date')
const {
  getAllStringsEnclosedBetweenCharacters,
  isNumeric,
} = require('../../shared/string')
const { astmE1394MessagesToJson } = require('../../shared/astm')
const { deviceSeen } = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')
const {
  allAssayToId,
  allSampleTypeToId,
  resultTypeToId,
  resultSourceToId,
  allResultCategoryToId,
  allResultWorkflowStatusToId,
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
      payload &&
      _.isString(payload) &&
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
    const sanitisedPayload = payload
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
    const arrayFromPossibleRepeatedValue = (jsonAstmObject, path) => {
      if (_.get(jsonAstmObject, `${path}.items`)) {
        return _.get(jsonAstmObject, `${path}.items`).map(i =>
          _.get(jsonAstmObject, `${path}.${i}`)
        )
      }
      if (!_.isEmpty(_.get(jsonAstmObject, `${path}.value`))) {
        return [_.get(jsonAstmObject, `${path}`)]
      }
      return []
    }
    const commentsFromJsonAstmRecord = jsonAstmRecord => {
      if (!_.isEmpty(jsonAstmRecord.comments)) {
        return {
          comments: jsonAstmRecord.comments.map(commentId => ({
            source: { I: 'Instrument' }[
              _.get(jsonAstmRecord, `${commentId}.3.value`)
            ],
            text: _.get(jsonAstmRecord, `${commentId}.4.value`),
            type: { G: 'Result Comment', I: 'Exception String' }[
              _.get(jsonAstmRecord, `${commentId}.5.value`)
            ],
            rawData: _.get(jsonAstmRecord, `${commentId}.value`),
          })),
        }
      }
      return {}
    }
    const enquiriesFromJsonAstmRecord = jsonAstmRecord => {
      if (!_.isEmpty(jsonAstmRecord.enquiries)) {
        return {
          enquiries: jsonAstmRecord.enquiries.map(enquiryId => ({
            specimenId: _.get(jsonAstmRecord, `${enquiryId}.3.value`),
            assayCode: _.get(jsonAstmRecord, `${enquiryId}.5.value`),
            statusCode: { O: 'Orders' }[
              _.get(jsonAstmRecord, `${enquiryId}.13.value`)
            ],
            rawData: _.get(jsonAstmRecord, `${enquiryId}.value`),
          })),
        }
      }
      return {}
    }
    const parseDate = value => {
      const parsedValue = parseDateOrDefault(value, {
        formatString: 'yyyyLLdd',
      })
      return parsedValue
        ? convertToTimeZone(parsedValue, { timeZone: 'UTC' })
        : parsedValue
    }
    const parseTime = value => {
      const parsedValue = parseDateOrDefault(value, {
        formatString: 'yyyyLLddHHmmss',
      })
      return parsedValue
        ? convertToTimeZone(parsedValue, { timeZone: 'UTC' })
        : parsedValue
    }
    const mergeDeep = (baseValue, sourceValue) => {
      if (_.isEmpty(baseValue) && !_.isEmpty(sourceValue)) {
        return sourceValue
      }
      if (!_.isEmpty(baseValue) && _.isEmpty(sourceValue)) {
        return baseValue
      }
      if (_.isArray(baseValue) && _.isArray(sourceValue)) {
        return [...(baseValue || []), ...(sourceValue || [])]
      }
      if (_.isPlainObject(baseValue) || _.isPlainObject(sourceValue)) {
        return
      }
      return sourceValue || baseValue
    }
    const parsedResults = jsonAstmMessages.reduce(
      (results, jsonAstmMessage) => {
        const instrumentSerial = _.get(jsonAstmMessage, 'H.4.3.value')
        const messageSentOn = parseTime(_.get(jsonAstmMessage, 'H.13.value'))
        const resultHeader = {
          device: {
            serial: instrumentSerial,
            lastSeenOn: utcNow,
            lastPingOn: utcNow,
            lastPingFromIp: remoteAddress,
            configurationData: {
              deviceTypeName: _.get(jsonAstmMessage, 'H.4.1.value'),
              deviceVersion: _.get(jsonAstmMessage, 'H.4.2.value'),
              interfaceVersion: _.get(jsonAstmMessage, 'H.4.4.value'),
              softwareVersion: _.get(jsonAstmMessage, 'H.12.value'),
            },
            ...commentsFromJsonAstmRecord(jsonAstmMessage.H),
            ...enquiriesFromJsonAstmRecord(jsonAstmMessage.H),
          },
          instrumentSerial,
          senderVersion: _.get(jsonAstmMessage, 'H.12.value'),
          resultData: {
            typeOfMessage: {
              P: 'Production',
              D: 'Debugging',
              Q: 'Quality Control',
            }[_.get(jsonAstmMessage, 'H.11.value')],
            messageIsComplete: _.get(jsonAstmMessage, 'L.2.value') === '1',
            messageSentOn,
          },
          rawData: jsonAstmMessage.value,
        }
        results = [
          ...results,
          ..._.get(jsonAstmMessage, 'H.patients', []).reduce(
            (results, patientId) => {
              const jsonAstmPatient = _.get(jsonAstmMessage, `H.${patientId}`)
              const patientData = {
                id: _.get(jsonAstmPatient, '4.value'), // Laboratory Patient ID
                practicePatientId: _.get(jsonAstmPatient, '3.value'),
                additionalPatientId: _.get(jsonAstmPatient, '5.value'),
                name: _.get(jsonAstmPatient, '6.value'),
                dateOfBirth: parseDate(_.get(jsonAstmPatient, '8.value')),
                gender: { M: 'Male', F: 'Female', U: 'Unknown' }[
                  _.get(jsonAstmPatient, '9.value')
                ],
                ethnicOrigin: _.get(jsonAstmPatient, '10.value'),
                address: _.get(jsonAstmPatient, '11.value'),
                phone: _.get(jsonAstmPatient, '13.value'),
                attendingPhysician: _.get(jsonAstmPatient, '14.value'),
                height: _.get(jsonAstmPatient, '17.value'),
                weight: _.get(jsonAstmPatient, '18.value'),
                diet: _.get(jsonAstmPatient, '21.value'),
                admissionOrDischargeDates: _.get(jsonAstmPatient, '24.value'),
                admissionStatus: _.get(jsonAstmPatient, '25.value'),
                location: _.get(jsonAstmPatient, '26.value'),
                isolationStatus: _.get(jsonAstmPatient, '31.value'),
                hospitalInstitution: _.get(jsonAstmPatient, '34.value'),
                dosageCategory: _.get(jsonAstmPatient, '35.value'),
                ...commentsFromJsonAstmRecord(jsonAstmPatient),
              }
              const patientDiagnoses = arrayFromPossibleRepeatedValue(
                jsonAstmPatient,
                '19'
              ).map(diagnosis => ({
                code: _.get(diagnosis, '1.value'),
                description: _.get(diagnosis, '2.value'),
              }))
              if (!_.isEmpty(patientDiagnoses)) {
                patientData.diagnoses = patientDiagnoses
              }
              const patientMedications = arrayFromPossibleRepeatedValue(
                jsonAstmPatient,
                '20'
              ).map(medication => ({
                name: _.get(medication, '1.value'),
                level: _.get(medication, '2.value'),
                startDate: _.get(medication, '3.value'),
                endDate: _.get(medication, '4.value'),
              }))
              if (!_.isEmpty(patientMedications)) {
                patientData.medications = patientMedications
              }
              results = [
                ...results,
                ..._.get(jsonAstmPatient, 'orders', []).reduce(
                  (results, orderId) => {
                    const jsonAstmOrder = jsonAstmPatient[orderId]
                    const sampleId = _.get(
                      jsonAstmOrder,
                      '3.1.value',
                      _.get(
                        jsonAstmOrder,
                        '3.value',
                        _.get(
                          jsonAstmOrder,
                          '4.1.value',
                          _.get(jsonAstmOrder, '4.value')
                        )
                      )
                    )
                    const startedOnString = _.get(jsonAstmOrder, '7.value')
                    const carouselId = _.get(
                      jsonAstmOrder,
                      '3.2.value',
                      _.get(jsonAstmOrder, '4.2.value')
                    )
                    const wellPosition = _.get(
                      jsonAstmOrder,
                      '3.3.value',
                      _.get(jsonAstmOrder, '4.3.value')
                    )
                    const testOrder = {
                      sample: {
                        externalId: sampleId,
                        collectedOn: parseTime(_.get(jsonAstmOrder, '8.value')),
                        sampleTypeExternalId: {
                          HIVQLDRDBS: 'DBS',
                          '1mLDBSvOP': 'DBS',
                          'HIV0.6ml': 'Plasma',
                        }[_.get(jsonAstmOrder, '5.4.value')],
                      },
                      assay: {
                        code: _.get(jsonAstmOrder, '5.4.value'),
                      },
                      sampleRunNumber: carouselId,
                      moduleName: wellPosition,
                      startedOn: parseTime(startedOnString),
                      resultData: {
                        assayName: _.get(jsonAstmOrder, '5.5.value'),
                        assayProtocol: _.get(jsonAstmOrder, '5.6.value'),
                        priority: { S: 'STAT', R: 'Routine' }[
                          _.get(jsonAstmOrder, '6.value')
                        ],
                        testQualifier: { P: 'Primary', C: 'Correlation' }[
                          _.get(jsonAstmOrder, '5.7.value')
                        ],
                        collectedBy: _.get(jsonAstmOrder, '11.value'),
                        actionCode:
                          {
                            C: 'Cancel Test Order',
                            A: 'Add Test to Order',
                            N: 'New Test Order',
                            Q: 'Quality Control Result',
                          }[_.get(jsonAstmOrder, '12.value')] ||
                          'Patient Result',
                        reportType: {
                          F: 'Final Result',
                          X: 'Test could not be performed',
                        }[_.get(jsonAstmOrder, '26.value')],
                        ...commentsFromJsonAstmRecord(jsonAstmOrder),
                      },
                    }
                    results = [
                      ...results,
                      ..._.get(jsonAstmOrder, 'results', ['']).reduce(
                        (results, resultId) => {
                          const jsonAstmResult = jsonAstmOrder[resultId] || {
                            '3': {
                              '9': {
                                value: 'F',
                              },
                            },
                            '13': {
                              value: startedOnString,
                            },
                            '14': {
                              value: instrumentSerial,
                            },
                          }
                          const moduleSerial = _.get(jsonAstmResult, '14.value')
                          const endedOnString = _.get(
                            jsonAstmResult,
                            '13.value'
                          )
                          const resultDateString =
                            startedOnString || endedOnString
                          const result = {
                            assay: {
                              code: _.get(jsonAstmResult, '3.4.value'),
                            },
                            externalId: `${sampleId}|${moduleSerial}|${carouselId}|${wellPosition}|${resultDateString ||
                              ''}`,
                            consumableLot: _.get(jsonAstmResult, '3.6.value'),
                            consumableSerial: _.get(
                              jsonAstmResult,
                              '3.7.value'
                            ),
                            senderOperator: _.get(
                              jsonAstmResult,
                              '11.2.value',
                              _.get(jsonAstmResult, '11.1.value')
                            ),
                            endedOn: parseTime(endedOnString) || messageSentOn,
                            moduleSerial,
                            resultData: {
                              assayName: _.get(jsonAstmResult, '3.5.value'),
                              priority: { S: 'STAT', R: 'Routine' }[
                                _.get(jsonAstmOrder, '6.value')
                              ],
                              resultType: {
                                F: 'Final Result',
                                P: 'Preliminary Result',
                                I: 'Interpretation of Final Result',
                              }[_.get(jsonAstmResult, '3.9.value')],
                              referenceRanges: _.get(jsonAstmResult, '6.value'),
                              abnormalFlags: arrayFromPossibleRepeatedValue(
                                jsonAstmResult,
                                '7'
                              ).map(abnormalFlag => abnormalFlag.value),
                              resultText: _.get(jsonAstmResult, '4.value'),
                              resultUnit: _.get(jsonAstmResult, '5.value'),
                              resultStatus: {
                                F: 'Final Result',
                                R: 'Previously Transmitted Result',
                              }[_.get(jsonAstmResult, '9.value')],
                              orderOperatorId: _.get(
                                jsonAstmResult,
                                '11.1.value'
                              ),
                              controlConsumableLotNumber: _.get(
                                jsonAstmResult,
                                '3.8.value'
                              ),
                              ...commentsFromJsonAstmRecord(jsonAstmResult),
                            },
                            patientData,
                          }
                          const mergedResultData = _.mergeWith(
                            _.mergeWith(
                              _.cloneDeep(resultHeader),
                              _.cloneDeep(testOrder),
                              mergeDeep
                            ),
                            result,
                            mergeDeep
                          )
                          results = [...results, mergedResultData]
                          return results
                        },
                        []
                      ),
                    ]
                    return results
                  },
                  []
                ),
              ]
              return results
            },
            []
          ),
        ]
        return results
      },
      []
    )
    const assayIds = await allAssayToId()
    const resultWorkflowStatuses = await allResultWorkflowStatusToId()
    const m2000AspectAssayIdMapping = {
      '1mLDBSvOP': assayIds.abbottM2000DBSHivVL,
      'HIV0.6ml': assayIds.abbottM2000PlasmaHivVL,
      HIVQLDRDBS: assayIds.abbottM2000HIVEID,
    }
    const resultCategories = await allResultCategoryToId()
    const resultCategoryMapping = {
      '1mLDBSvOP': {
        I: {
          Detected: resultCategories.Detected,
          'Target not detected': resultCategories.NotDetected,
        },
        F: {
          'Not detected': resultCategories.NotDetected,
          '< 550': resultCategories.LessThan550,
          Numeric: resultCategories.MoreThan550,
        },
      },
      'HIV0.6ml': {
        I: {
          Detected: resultCategories.Detected,
          'Target not detected': resultCategories.NotDetected,
        },
        F: {
          'Not detected': resultCategories.NotDetected,
          '< 40': resultCategories.LessThan40,
          Numeric: resultCategories.MoreThan40,
        },
      },
      HIVQLDRDBS: {
        F: {
          'HIV-1 Detected': resultCategories.Detected,
          'Not Detected': resultCategories.NotDetected,
        },
      },
    }
    const resultCategoryErrorId = resultCategories.Error
    const sampleTypeIds = await allSampleTypeToId()
    const unknownAssayCodes = parsedResults
      .map(parsedResult => _.get(parsedResult, 'assay.code'))
      .filter(
        assayCode => !Object.keys(m2000AspectAssayIdMapping).includes(assayCode)
      )
    if (!_.isEmpty(unknownAssayCodes)) {
      throw Boom.badRequest(
        `Unknown assay codes: ${_.uniq(unknownAssayCodes).join(', ')}`
      )
    }
    const resultExternalIds = _.uniq(
      parsedResults
        .filter(
          parsedResult =>
            _.get(parsedResult, 'resultData.actionCode') === 'Patient Result'
        )
        .map(parsedResult => parsedResult.externalId)
    )
    const qualityControlResults = parsedResults.filter(
      parsedResult =>
        _.get(parsedResult, 'resultData.actionCode') ===
        'Quality Control Result'
    )
    const hivQualityControlResultsToSummary = (
      hivQualityControlResults,
      passFinalResult,
      passCycleNumber
    ) => {
      const finalResult = hivQualityControlResults.find(
        result => result.resultData.resultType === 'Final Result'
      )
      const qualityControlSummary = {}
      if (finalResult) {
        Object.assign(qualityControlSummary, {
          passed: passFinalResult(finalResult),
          reportType: finalResult.resultData.reportType,
          abnormalFlags: finalResult.resultData.abnormalFlags,
          result: finalResult.resultData.resultText,
          moduleName: finalResult.moduleName,
          assayCode: finalResult.assay.code,
          assayName: finalResult.resultData.assayName,
          consumableLot: finalResult.consumableLot,
          consumableSerial: finalResult.consumableSerial,
          controlConsumableLotNumber:
            finalResult.resultData.controlConsumableLotNumber,
          endedOn: finalResult.endedOn,
          moduleSerial: finalResult.moduleSerial,
          orderOperatorId: finalResult.resultData.orderOperatorId,
          senderOperator: finalResult.senderOperator,
        })
      }
      const cycleNumberResult = hivQualityControlResults.find(
        result => result.resultData.resultType === 'Preliminary Result'
      )
      if (cycleNumberResult) {
        const cycleNumberSummary = {}
        if (!passCycleNumber(cycleNumberResult)) {
          Object.assign(cycleNumberSummary, {
            passed: false,
            reportType: cycleNumberResult.resultData.reportType,
          })
        }
        if (cycleNumberResult.resultData.resultText) {
          Object.assign(cycleNumberSummary, {
            cycleNumber: parseFloat(cycleNumberResult.resultData.resultText),
          })
        }
        Object.assign(qualityControlSummary, cycleNumberSummary)
        qualityControlSummary.abnormalFlags = _.uniq([
          ...(qualityControlSummary.abnormalFlags || []),
          ...(cycleNumberResult.resultData.abnormalFlags || []),
        ])
      }
      return qualityControlSummary
    }
    const qualityControlSummaries = _.uniq(
      qualityControlResults.map(
        qualityControlResult => qualityControlResult.sampleRunNumber
      )
    ).reduce((qualityControlSummaries, sampleRunNumber) => {
      const qualityControlResultsForRun = qualityControlResults.filter(
        qualityControlResult =>
          qualityControlResult.sampleRunNumber === sampleRunNumber
      )
      const qualityControlAssayCodes = _.uniq(
        qualityControlResultsForRun.map(result => result.assay.code)
      )
      const qualityControlSummary = qualityControlAssayCodes.reduce(
        (qualityControlSummary, assayCode) => {
          // If this is an HIV Assay
          const qualityControlSummaryForAssay = {}
          if (['1mLDBSvOP', 'HIV0.6ml', 'HIVQLDRDBS'].includes(assayCode)) {
            const negResults = qualityControlResultsForRun.filter(
              result => result.sample.externalId === 'HIV_NEG'
            )
            if (!_.isEmpty(negResults)) {
              qualityControlSummaryForAssay.negativeControl = hivQualityControlResultsToSummary(
                negResults,
                finalResult =>
                  finalResult.resultData.reportType === 'Final Result' &&
                  ['Passed', 'Not detected'].includes(
                    finalResult.resultData.resultText
                  ),
                cycleNumberResult =>
                  cycleNumberResult.resultData.reportType === 'Final Result'
              )
            }
            const lowPositiveResults = qualityControlResultsForRun.filter(
              result => result.sample.externalId === 'HIV_LOPOS'
            )
            if (!_.isEmpty(lowPositiveResults)) {
              qualityControlSummaryForAssay.lowPositiveControl = hivQualityControlResultsToSummary(
                lowPositiveResults,
                finalResult =>
                  finalResult.resultData.reportType === 'Final Result' &&
                  (finalResult.resultData.resultText === 'Passed' ||
                    isNumeric(finalResult.resultData.resultText)),
                cycleNumberResult =>
                  cycleNumberResult.resultData.reportType === 'Final Result'
              )
            }
            const highPositiveResults = qualityControlResultsForRun.filter(
              result => result.sample.externalId === 'HIV_HIPOS'
            )
            if (!_.isEmpty(highPositiveResults)) {
              qualityControlSummaryForAssay.highPositiveControl = hivQualityControlResultsToSummary(
                highPositiveResults,
                finalResult =>
                  finalResult.resultData.reportType === 'Final Result' &&
                  (finalResult.resultData.resultText === 'Passed' ||
                    isNumeric(finalResult.resultData.resultText)),
                cycleNumberResult =>
                  cycleNumberResult.resultData.reportType === 'Final Result'
              )
            }
          } // TODO: Add Quality Control Logic for TB and other assay codes when we learn more about them
          qualityControlSummary[assayCode] = qualityControlSummaryForAssay
          return qualityControlSummary
        },
        {}
      )
      qualityControlSummaries[sampleRunNumber] = qualityControlSummary
      return qualityControlSummaries
    }, {})
    const latestDevice = parsedResults
      .map(parsedResult => ({
        ...parsedResult.device,
        rawData: parsedResult.rawData,
      }))
      .sort((device1, device2) => device1.lastSeenOn >= device2.lastSeenOn)
      .pop()
    const deviceDetailsInPayload = _.mergeWith(
      _.cloneDeep(latestDevice),
      {
        configurationData: {
          comments: _.uniq(
            parsedResults
              .filter(
                parsedResult =>
                  !_.isEmpty(_.get(parsedResult, 'device.comments'))
              )
              .map(parsedResult => _.get(parsedResult, 'device.comments'))
          ),
          enquiries: _.uniq(
            parsedResults
              .filter(
                parsedResult =>
                  !_.isEmpty(_.get(parsedResult, 'device.enquiries'))
              )
              .map(parsedResult => _.get(parsedResult, 'device.enquiries'))
          ),
        },
      },
      mergeDeep
    )

    await transact(async knex => {
      const deviceApiKey =
        (await knex('DeviceApiKey')
          .where('token', auth.credentials.token)
          .first()) || {}
      if (!deviceApiKey.deviceId) {
        throw Boom.badRequest(
          'Invalid device API key: Cannot determine which device this came from'
        )
      }
      const device = await knex('Device')
        .where('id', deviceApiKey.deviceId)
        .first()
      const site =
        (await knex('Site')
          .where('id', device.siteId)
          .first()) || {}
      const resultSourceDiagnosticDeviceId = await resultSourceToId(
        'DiagnosticDevice'
      )
      const resultTypePatientId = await resultTypeToId('Patient')
      this.response.deviceId = device.id
      this.response.deviceLogIds = []
      if (deviceDetailsInPayload.lastSeenOn >= device.lastSeenOn) {
        device.configurationData = JSON.parse(device.configurationData)
        const deviceUpdates = _.mergeWith(
          _.cloneDeep(device),
          _.cloneDeep(
            _.omit(deviceDetailsInPayload, ['comments', 'enquiries', 'rawData'])
          ),
          { updatedOn: utcNow },
          mergeDeep
        )
        if (!_.isNil(deviceUpdates.configurationData)) {
          deviceUpdates.configurationData = JSON.stringify(
            deviceUpdates.configurationData
          )
        }
        await knex('Device')
          .where('id', device.id)
          .update(deviceUpdates)
        const [configDeviceLogId] = await knex('DeviceLog').insert({
          deviceId: device.id,
          source: this.name,
          deviceConfigurationUpdated: true,
          createdOn: utcNow,
          senderIp: remoteAddress,
          rawMessage: deviceDetailsInPayload.rawData,
        })
        this.response.deviceLogIds = [
          ...this.response.deviceLogIds,
          configDeviceLogId,
        ]
        if (!_.isEmpty(deviceDetailsInPayload.comments)) {
          const commentDeviceLogIds = await Promise.each(
            deviceDetailsInPayload.comments,
            async comment => {
              const [commentDeviceLogId] = await knex('DeviceLog').insert({
                deviceId: device.id,
                source: this.name,
                createdOn: utcNow,
                senderIp: remoteAddress,
                rawMessage: comment.rawData,
              })
              return commentDeviceLogId
            }
          )
          this.response.deviceLogIds = [
            ...this.response.deviceLogIds,
            ...commentDeviceLogIds,
          ]
        }
        if (!_.isEmpty(deviceDetailsInPayload.enquiries)) {
          const enquiryDeviceLogIds = await Promise.each(
            deviceDetailsInPayload.enquiries,
            async comment => {
              const [enquiryDeviceLogId] = await knex('DeviceLog').insert({
                deviceId: device.id,
                source: this.name,
                createdOn: utcNow,
                senderIp: remoteAddress,
                rawMessage: comment.rawData,
              })
              return enquiryDeviceLogId
            }
          )
          this.response.deviceLogIds = [
            ...this.response.deviceLogIds,
            ...enquiryDeviceLogIds,
          ]
        }
      }
      this.messageContext.dispatch(deviceSeen(device.id))
      await Promise.each(resultExternalIds, async resultExternalId => {
        const resultsWithSameId = parsedResults.filter(
          parsedResult => parsedResult.externalId === resultExternalId
        )
        const finalResult = resultsWithSameId.find(
          result => result.resultData.resultType === 'Final Result'
        )
        const existingSample =
          (await knex('Sample as s')
            .join('SampleType as st', 's.sampleTypeId', 'st.id')
            .where('s.externalId', finalResult.sample.externalId)
            .andWhere('st.externalId', finalResult.sample.sampleTypeExternalId)
            .first('s.*')) || {}
        let { id: sampleId } = existingSample
        const { collectedOn, originSiteId } = existingSample
        if (!sampleId) {
          ;[sampleId] = await knex('Sample').insert({
            externalId: finalResult.sample.externalId,
            collectedOn: finalResult.sample.collectedOn,
            sampleTypeId:
              sampleTypeIds[finalResult.sample.sampleTypeExternalId],
          })
        } else if (
          finalResult.sample.collectedOn &&
          !dateEqual(collectedOn, finalResult.sample.collectedOn)
        ) {
          await knex('Sample')
            .where('id', sampleId)
            .update({ collectedOn: finalResult.sample.collectedOn })
        }
        const qualityControlSummary = _.get(
          qualityControlSummaries,
          `${finalResult.sampleRunNumber}.${finalResult.assay.code}`,
          {}
        )
        const passedQualityControl =
          _.isEmpty(qualityControlSummary) ||
          (Object.values(qualityControlSummary).every(
            control => control.passed
          ) &&
            (_.isEmpty(qualityControlSummary.lowPositiveControl) ||
              _.isEmpty(qualityControlSummary.highPositiveControl) ||
              !isNumeric(qualityControlSummary.lowPositiveControl.result) ||
              !isNumeric(qualityControlSummary.highPositiveControl.result) ||
              parseFloat(qualityControlSummary.highPositiveControl.result) >
                parseFloat(qualityControlSummary.lowPositiveControl.result)))
        const cycleNumberResult = resultsWithSameId.find(
          result => result.resultData.resultType === 'Preliminary Result'
        )
        const interpretationResult = resultsWithSameId.find(
          result =>
            result.resultData.resultType === 'Interpretation of Final Result'
        )

        const result = _.mergeWith(
          _.cloneDeep(
            _.omit(cycleNumberResult || {}, ['device', 'sample', 'assay'])
          ),
          _.cloneDeep(
            _.omit(interpretationResult || {}, ['device', 'sample', 'assay'])
          ),
          _.cloneDeep(_.omit(finalResult, ['device', 'sample', 'assay'])),
          {
            assayId: m2000AspectAssayIdMapping[finalResult.assay.code],
            partnerId: deviceApiKey.partnerId,
            geographyId: device.geographyId,
            siteId: site.id,
            deviceId: device.id,
            longitude: site.longitude,
            latitude: site.latitude,
            resultSourceId: resultSourceDiagnosticDeviceId,
            resultTypeId: resultTypePatientId,
            sampleId,
            reportableSiteId: originSiteId,
            resultData: {
              passedQualityControl,
              qualityControlSummary,
            },
            updatedOn: utcNow,
          }
        )
        if (result.resultData.reportType !== 'Final Result') {
          result.resultCategory1 = resultCategoryErrorId
          const testExceptionComments = _.get(
            result,
            'resultData.comments',
            []
          ).filter(comment => comment.type === 'Exception String')
          const testExceptionCodes = _.uniq(
            testExceptionComments.map(comment =>
              comment.text.split(':')[0].trim()
            )
          )
          result.errorCode = [
            ...result.resultData.abnormalFlags,
            ...testExceptionCodes,
          ].join(',')
          result.errorNotes = _.uniq(
            testExceptionComments.map(comment => comment.text)
          ).join('\n')
        } else {
          const interpretationResultCategoryId = interpretationResult
            ? resultCategoryMapping[interpretationResult.assay.code].I[
                interpretationResult.resultData.resultText
              ]
            : null
          const finalResultCategoryId =
            resultCategoryMapping[finalResult.assay.code].F[
              _.isNaN(finalResult.resultData.resultText)
                ? finalResult.resultData.resultText
                : 'Numeric'
            ]
          if (interpretationResult) {
            result.resultCategory1 = interpretationResultCategoryId
            result.resultCategory2 = finalResultCategoryId
          } else {
            result.resultCategory1 = finalResultCategoryId
          }
        }
        result.notes = _.uniq(
          (result.resultData.comments || []).map(comment => comment.text)
        ).join('\n')
        const existingResult = await knex('Result')
          .where('externalId', result.externalId)
          .andWhere('deviceId', device.id)
          .first()
        const resultWorkflowStatusId =
          resultWorkflowStatuses[
            result.resultCategory1 === resultCategoryErrorId
              ? 'Error'
              : 'Processed'
          ]
        if (existingResult) {
          result.id = existingResult.id
          existingResult.resultData = JSON.parse(
            existingResult.resultData || '{}'
          )
          existingResult.patientData = JSON.parse(
            existingResult.patientData || '{}'
          )
          existingResult.formData = JSON.parse(existingResult.formData || '{}')
          if (existingResult.notes) {
            result.notes = _.uniq(
              `${existingResult.notes}\n${result.notes}`.split('\n')
            ).join('\n')
          }
          const resultWorkflowStatusLog =
            (await knex('ResultWorkflowStatusLog')
              .where('id', existingResult.resultWorkflowStatusLogId)
              .first()) || {}
          if (
            [
              resultWorkflowStatuses.OK,
              resultWorkflowStatuses.Error,
              resultWorkflowStatuses.Ordered,
              resultWorkflowStatuses.InProgress,
              resultWorkflowStatuses.Processed,
            ].includes(resultWorkflowStatusLog.resultWorkflowStatusId)
          ) {
            const [resultWorkflowStatusLogId] = await knex(
              'ResultWorkflowLog'
            ).insert({
              resultId: existingResult.id,
              resultWorkflowStatusId,
              operator: finalResult.senderOperator,
              reason: `Result update from ${this.name}`,
              changedOn: utcNow,
              createdOn: utcNow,
            })
            result.resultWorkflowStatusLogId = resultWorkflowStatusLogId
          }
          Object.assign(existingResult, result)
          await knex('Result')
            .where('id', result.id)
            .update({
              ...existingResult,
              resultData: existingResult.resultData
                ? JSON.stringify(existingResult.resultData)
                : null,
              patientData: existingResult.patientData
                ? JSON.stringify(existingResult.patientData)
                : null,
              formData: existingResult.formData
                ? JSON.stringify(existingResult.formData)
                : null,
            })
        } else {
          result.createdOn = utcNow
          const [resultId] = await knex('Result').insert({
            ...result,
            resultData: result.resultData
              ? JSON.stringify(result.resultData)
              : null,
            patientData: result.patientData
              ? JSON.stringify(result.patientData)
              : null,
            formData: result.formData ? JSON.stringify(result.formData) : null,
          })
          result.id = resultId
        }
        if (!result.resultWorkflowStatusLogId) {
          const [resultWorkflowStatusLogId] = await knex(
            'ResultWorkflowLog'
          ).insert({
            resultId: result.id,
            resultWorkflowStatusId,
            operator: finalResult.senderOperator,
            reason: `New result from ${this.name}`,
            changedOn: utcNow,
            createdOn: utcNow,
          })
          await knex('Result')
            .where('id', result.id)
            .update({ resultWorkflowStatusLogId })
        }
        const [resultDeviceLogId] = await knex('DeviceLog').insert({
          deviceId: device.id,
          source: this.name,
          createdOn: utcNow,
          senderIp: remoteAddress,
          rawMessage: result.rawData,
          resultId: result.id,
        })
        this.response.deviceLogIds = [
          ...this.response.deviceLogIds,
          resultDeviceLogId,
        ]
        // TODO: Inventory, reduce reagent and control reagent
      })
    })
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = DefaultAbbottM2000
