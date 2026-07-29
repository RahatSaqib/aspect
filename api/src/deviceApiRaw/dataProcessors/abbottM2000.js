const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('@hapi/boom')
const { convertToTimeZone } = require('date-fns-timezone')
const { transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const { parseDateOrDefault, dateEqual } = require('../../shared/date')
const { isNumeric } = require('../../shared/string')
const { astmE1394MessagesToJson } = require('../../shared/astm')
const { deviceSeen } = require('../../device/actions')
const { resultLogged } = require('../../result/actions')
const { SynchronousDataProcessor } = require('./_base')
const {
  allAssayToId,
  allSampleTypeToId,
  resultTypeToId,
  resultSourceToId,
  allResultCategoryToId,
} = require('../../shared/dictionary')

const mergeDeep = (baseValue, sourceValue) => {
  if (_.isEmpty(baseValue) && !_.isEmpty(sourceValue)) {
    return sourceValue
  }
  if (!_.isEmpty(baseValue) && _.isEmpty(sourceValue)) {
    return baseValue
  }
  if (_.isArray(baseValue) && _.isArray(sourceValue)) {
    return _.uniqBy([...(baseValue || []), ...(sourceValue || [])], JSON.stringify)
  }
  if (_.isPlainObject(baseValue) || _.isPlainObject(sourceValue)) {
    return _.mergeWith(_.cloneDeep(baseValue), _.cloneDeep(sourceValue), mergeDeep)
  }
  return sourceValue || baseValue
}

class DefaultAbbottM2000 extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static containsM2000AstmLineHeader(line) {
    return /H.{7,14}m2000.{1,2}\d*\.\d*\.\d*\.\d*.*\n/.test(line)
  }

  static sanitisePayload(payload) {
    return `\n${payload}`
      .replace(/\u0002/g, '') // eslint-disable-line no-control-regex
      .replace(/\u0003/g, '\n') // eslint-disable-line no-control-regex
      .replace(/\r/g, '')
      .replace(/\x02/g, '') // eslint-disable-line no-control-regex
      .replace(/\x03/g, '') // eslint-disable-line no-control-regex
      .replace(/(a*)?\(?l?p(\d)*\n/g, '\n')
      .replace(/\n(a*)?S'(\d)?/g, '\n')
      .replace(/\\r\\x[a-zA-Z0-9]{4}\\r\\n'\n/g, '\n')
      .replace(/\na*\.\n?/g, '')
      .replace(/\n[A-Z0-9]{2}\n/g, '\n')
      .replace(/\n+/g, '\n')
      .replace(/\n[0-9]?/g, '\n')
      .trim()
  }

  static async canProcessRequest(request) {
    const { payload } = request
    if (!payload) {
      return false
    }
    const sanitisedPayload = DefaultAbbottM2000.sanitisePayload(payload)
    return DefaultAbbottM2000.containsM2000AstmLineHeader(sanitisedPayload)
  }

  // ASTM fields may contain multiple values inside of them
  //   EG: This is an example of an order line: 3O|1|091/20|091/20^037^A1|^^^Daan nCOVID-19 ORF LDA^Daan nCOVID-19 ORF LDA|||||||||||||||||||||F
  //       It's fields are separated by a pipe (|) character
  //       The fifth field is the Universal Test ID field which contains the following values:
  //         ^^^Assay_code & ^Assay_name
  //         It can also contain ^Assay protocol & ^Test Qualifier when these values are applicable
  // This method extracts the array value from specified field in the JSON object representation of the ASTM message
  arrayFromPossibleRepeatedASTMValue(jsonAstmObject, path) {
    if (_.get(jsonAstmObject, `${path}.items`)) {
      return _.get(jsonAstmObject, `${path}.items`).map(i => _.get(jsonAstmObject, `${path}.${i}`))
    }
    if (!_.isEmpty(_.get(jsonAstmObject, `${path}.value`))) {
      return [_.get(jsonAstmObject, `${path}`)]
    }
    return []
  }

  commentsFromJsonAstmRecord(jsonAstmRecord) {
    if (!_.isEmpty(jsonAstmRecord.comments)) {
      return {
        comments: jsonAstmRecord.comments.map(commentId => ({
          source: { I: 'Instrument' }[_.get(jsonAstmRecord, `${commentId}.3.value`)],
          text: _.get(jsonAstmRecord, `${commentId}.4.value`),
          type: { G: 'Result Comment', I: 'Exception String' }[_.get(jsonAstmRecord, `${commentId}.5.value`)],
          rawData: _.get(jsonAstmRecord, `${commentId}.value`),
        })),
      }
    }
    return {}
  }

  enquiriesFromJsonAstmRecord(jsonAstmRecord) {
    if (!_.isEmpty(jsonAstmRecord.enquiries)) {
      return {
        enquiries: jsonAstmRecord.enquiries.map(enquiryId => ({
          specimenId: _.get(jsonAstmRecord, `${enquiryId}.3.value`),
          assayCode: _.get(jsonAstmRecord, `${enquiryId}.5.value`),
          statusCode: { O: 'Orders' }[_.get(jsonAstmRecord, `${enquiryId}.13.value`)],
          rawData: _.get(jsonAstmRecord, `${enquiryId}.value`),
        })),
      }
    }
    return {}
  }

  parseDate(value) {
    const parsedValue = parseDateOrDefault(value, {
      formatString: 'yyyyMMdd',
    })
    return parsedValue ? convertToTimeZone(parsedValue, { timeZone: 'UTC' }) : parsedValue
  }

  parseTime(value) {
    const parsedValue = parseDateOrDefault(value, {
      formatString: 'yyyyMMddHHmmss',
    })
    return parsedValue ? convertToTimeZone(parsedValue, { timeZone: 'UTC' }) : parsedValue
  }

  bothResultsAreNumericAndFirstResultIsHigherThanTheSecond(firstResult, secondResult) {
    if (!firstResult || !secondResult) {
      return false
    }
    if (!isNumeric(firstResult.resultData.resultText) || !isNumeric(secondResult.resultData.resultText)) {
      return false
    }
    return parseFloat(firstResult.resultData.resultText) > parseFloat(secondResult.resultData.resultText)
  }

  setupAssayMappings(assayIds, resultCategories) {
    const processViralLoadResultsWithSameId = this.processViralLoadResultsWithSameId.bind(this)
    const processDaanNCovid19ResultsWithSameId = this.processDaanNCovid19ResultsWithSameId.bind(this)
    return {
      '1mLDBSvOP': {
        id: assayIds.abbottM2000DBSHivVL,
        resultCategories: {
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
        defaultSampleTypeExternalId: 'DBS',
        isQuantitative: true,
        highPositiveControlSpecimenId: 'HIV_HIPOS',
        lowPositiveControlSpecimenId: 'HIV_LOPOS',
        negativeControlSpecimenId: 'HIV_NEG',
        processResult: processViralLoadResultsWithSameId,
      },
      HIV1mlDBS: {
        id: assayIds.abbottM2000DBSHivVL,
        resultCategories: {
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
        defaultSampleTypeExternalId: 'DBS',
        isQuantitative: true,
        highPositiveControlSpecimenId: 'HIV_HIPOS',
        lowPositiveControlSpecimenId: 'HIV_LOPOS',
        negativeControlSpecimenId: 'HIV_NEG',
        processResult: processViralLoadResultsWithSameId,
      },
      'HIV0.6ml': {
        id: assayIds.abbottM2000PlasmaHivVL,
        resultCategories: {
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
        defaultSampleTypeExternalId: 'Plasma',
        isQuantitative: true,
        highPositiveControlSpecimenId: 'HIV_HIPOS',
        lowPositiveControlSpecimenId: 'HIV_LOPOS',
        negativeControlSpecimenId: 'HIV_NEG',
        processResult: processViralLoadResultsWithSameId,
      },
      'HIV0.2ml': {
        id: assayIds.abbottM2000PlasmaHivVL,
        resultCategories: {
          I: {
            Detected: resultCategories.Detected,
            'Target not detected': resultCategories.NotDetected,
          },
          F: {
            'Not detected': resultCategories.NotDetected,
            '< 150': resultCategories.LessThan150,
            Numeric: resultCategories.MoreThan150,
          },
        },
        defaultSampleTypeExternalId: 'Plasma',
        isQuantitative: true,
        highPositiveControlSpecimenId: 'HIV_HIPOS',
        lowPositiveControlSpecimenId: 'HIV_LOPOS',
        negativeControlSpecimenId: 'HIV_NEG',
        processResult: processViralLoadResultsWithSameId,
      },
      HIVQLDRDBS: {
        id: assayIds.abbottM2000HIVEID,
        resultCategories: {
          F: {
            'HIV-1 Detected': resultCategories.Detected,
            'Not Detected': resultCategories.NotDetected,
          },
        },
        defaultSampleTypeExternalId: 'DBS',
        isQuantitative: false,
        positiveControlSpecimenId: 'HIV_POS',
        negativeControlSpecimenId: 'HIV_NEG',
        processResult: processViralLoadResultsWithSameId,
      },
      'HBV 0.2ml': {
        id: assayIds.abbottM2000PlasmaHbvVL,
        resultCategories: {
          I: {
            Detected: resultCategories.Detected,
            'Target not detected': resultCategories.NotDetected,
          },
          F: {
            'Not detected': resultCategories.NotDetected,
            '< 15': resultCategories.LessThan150,
            Numeric: resultCategories.MoreThan150,
          },
        },
        defaultSampleTypeExternalId: 'Plasma',
        isQuantitative: true,
        highPositiveControlSpecimenId: 'HBV_HIPOS',
        lowPositiveControlSpecimenId: 'HBV_LOPOS',
        negativeControlSpecimenId: 'HBV_NEG',
        processResult: processViralLoadResultsWithSameId,
      },
      'Daan nCOVID-19 ORF LDA': {
        id: assayIds.abbottM2000DaanNCOVID19,
        resultCategories: {
          I: {
            Negative: resultCategories.NotDetected,
            Positive: resultCategories.Detected,
          },
        },
        defaultSampleTypeExternalId: 'Other',
        isQuantitative: false,
        positiveControlSpecimenId: 'CoV_POS',
        negativeControlSpecimenId: 'CoV_NEG',
        processResult: processDaanNCovid19ResultsWithSameId,
      },
      'Daan Target N gene LDA': {
        id: assayIds.abbottM2000DaanNCOVID19,
        resultCategories: {
          I: {
            Negative: resultCategories.NotDetected,
            Positive: resultCategories.Detected,
          },
        },
        defaultSampleTypeExternalId: 'Other',
        isQuantitative: false,
        positiveControlSpecimenId: 'CoV_POS',
        negativeControlSpecimenId: 'CoV_NEG',
        processResult: processDaanNCovid19ResultsWithSameId,
      },
    }
  }

  convertJsonParsedASTMMessagesToResultDetails(jsonAstmMessages, assayMappings, utcNow, remoteAddress) {
    return jsonAstmMessages.reduce((results, jsonAstmMessage) => {
      const instrumentSerial = _.get(jsonAstmMessage, 'H.4.3.value')
      const messageSentOn = this.parseTime(_.get(jsonAstmMessage, 'H.13.value'))
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
          ...this.commentsFromJsonAstmRecord(jsonAstmMessage.H),
          ...this.enquiriesFromJsonAstmRecord(jsonAstmMessage.H),
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
        ..._.get(jsonAstmMessage, 'H.patients', []).reduce((results, patientId) => {
          const jsonAstmPatient = _.get(jsonAstmMessage, `H.${patientId}`)
          const patientData = {
            id: _.get(jsonAstmPatient, '4.value'), // Laboratory Patient ID
            practicePatientId: _.get(jsonAstmPatient, '3.value'),
            additionalPatientId: _.get(jsonAstmPatient, '5.value'),
            name: _.get(jsonAstmPatient, '6.value'),
            dateOfBirth: this.parseDate(_.get(jsonAstmPatient, '8.value')),
            gender: { M: 'Male', F: 'Female', U: 'Unknown' }[_.get(jsonAstmPatient, '9.value')],
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
            ...this.commentsFromJsonAstmRecord(jsonAstmPatient),
          }
          const patientDiagnoses = this.arrayFromPossibleRepeatedASTMValue(jsonAstmPatient, '19').map(diagnosis => ({
            code: _.get(diagnosis, '1.value'),
            description: _.get(diagnosis, '2.value'),
          }))
          if (!_.isEmpty(patientDiagnoses)) {
            patientData.diagnoses = patientDiagnoses
          }
          const patientMedications = this.arrayFromPossibleRepeatedASTMValue(jsonAstmPatient, '20').map(medication => ({
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
            ..._.get(jsonAstmPatient, 'orders', []).reduce((results, orderId) => {
              const jsonAstmOrder = jsonAstmPatient[orderId]
              const sampleId = _.get(
                jsonAstmOrder,
                '3.1.value',
                _.get(jsonAstmOrder, '3.value', _.get(jsonAstmOrder, '4.1.value', _.get(jsonAstmOrder, '4.value')))
              )
              const startedOnString = _.get(jsonAstmOrder, '7.value')
              const carouselId = _.get(jsonAstmOrder, '3.2.value', _.get(jsonAstmOrder, '4.2.value'))
              const wellPosition = _.get(jsonAstmOrder, '3.3.value', _.get(jsonAstmOrder, '4.3.value'))
              const deviceAssayCode = _.get(jsonAstmOrder, '5.4.value')
              const testOrder = {
                sample: {
                  externalId: sampleId,
                  collectedOn: this.parseTime(_.get(jsonAstmOrder, '8.value')),
                  sampleTypeExternalId: _.get(assayMappings, `${deviceAssayCode}.defaultSampleTypeExternalId`),
                },
                assay: {
                  code: deviceAssayCode,
                },
                sampleRunNumber: carouselId,
                moduleName: wellPosition,
                startedOn: this.parseTime(startedOnString),
                resultData: {
                  assayName: _.get(jsonAstmOrder, '5.5.value'),
                  assayProtocol: _.get(jsonAstmOrder, '5.6.value'),
                  priority: { S: 'STAT', R: 'Routine' }[_.get(jsonAstmOrder, '6.value')],
                  testQualifier: { P: 'Primary', C: 'Correlation' }[_.get(jsonAstmOrder, '5.7.value')],
                  collectedBy: _.get(jsonAstmOrder, '11.value'),
                  actionCode:
                    {
                      C: 'Cancel Test Order',
                      A: 'Add Test to Order',
                      N: 'New Test Order',
                      Q: 'Quality Control Result',
                    }[_.get(jsonAstmOrder, '12.value')] || 'Patient Result',
                  reportType: {
                    F: 'Final Result',
                    X: 'Test could not be performed',
                  }[_.get(jsonAstmOrder, '26.value')],
                  ...this.commentsFromJsonAstmRecord(jsonAstmOrder),
                },
              }
              results = [
                ...results,
                ..._.get(jsonAstmOrder, 'results', ['']).reduce((results, resultId) => {
                  const jsonAstmResult = jsonAstmOrder[resultId] || {
                    3: {
                      9: {
                        value: 'F',
                      },
                    },
                    13: {
                      value: startedOnString,
                    },
                    14: {
                      value: instrumentSerial,
                    },
                  }
                  const moduleSerial = _.get(jsonAstmResult, '14.value')
                  const endedOnString = _.get(jsonAstmResult, '13.value')
                  const resultDateString = startedOnString || endedOnString
                  const result = {
                    assay: {
                      code: _.get(jsonAstmResult, '3.4.value'),
                    },
                    externalId: `${sampleId}|${moduleSerial}|${carouselId}|${wellPosition}|${resultDateString || ''}`,
                    consumableLot: _.get(jsonAstmResult, '3.6.value'),
                    consumableSerial: _.get(jsonAstmResult, '3.7.value'),
                    senderOperator: _.get(jsonAstmResult, '11.2.value', _.get(jsonAstmResult, '11.1.value')),
                    endedOn: this.parseTime(endedOnString) || messageSentOn,
                    moduleSerial,
                    resultData: {
                      assayName: _.get(jsonAstmResult, '3.5.value'),
                      priority: { S: 'STAT', R: 'Routine' }[_.get(jsonAstmOrder, '6.value')],
                      resultType: {
                        F: 'Final Result',
                        P: 'Preliminary Result',
                        I: 'Interpretation of Final Result',
                      }[_.get(jsonAstmResult, '3.9.value')],
                      referenceRanges: _.get(jsonAstmResult, '6.value'),
                      abnormalFlags: this.arrayFromPossibleRepeatedASTMValue(jsonAstmResult, '7').map(
                        abnormalFlag => abnormalFlag.value
                      ),
                      resultText: _.get(jsonAstmResult, '4.value'),
                      resultUnit: _.get(jsonAstmResult, '5.value'),
                      resultStatus: {
                        F: 'Final Result',
                        R: 'Previously Transmitted Result',
                      }[_.get(jsonAstmResult, '9.value')],
                      orderOperatorId: _.get(jsonAstmResult, '11.1.value'),
                      controlConsumableLotNumber: _.get(jsonAstmResult, '3.8.value'),
                      ...this.commentsFromJsonAstmRecord(jsonAstmResult),
                    },
                    patientData,
                  }
                  const mergedResultData = _.mergeWith(
                    _.mergeWith(_.cloneDeep(resultHeader), _.cloneDeep(testOrder), mergeDeep),
                    result,
                    mergeDeep
                  )
                  results = [...results, mergedResultData]
                  return results
                }, []),
              ]
              return results
            }, []),
          ]
          return results
        }, []),
      ]
      return results
    }, [])
  }

  quantitativePositiveControlsPassed(highPositiveControlFinalResult, lowPositiveControlFinalResult) {
    return this.bothResultsAreNumericAndFirstResultIsHigherThanTheSecond(
      highPositiveControlFinalResult,
      lowPositiveControlFinalResult
    )
  }

  qualitativePositiveControlsPassed(positiveControlFinalResult, positiveControlPreliminaryResult) {
    return this.bothResultsAreNumericAndFirstResultIsHigherThanTheSecond(
      positiveControlFinalResult,
      positiveControlPreliminaryResult
    )
  }

  negativeControlPassed(negativeControlFinalResult) {
    return ['Not detected', 'Negative'].includes(negativeControlFinalResult.resultData.resultText)
  }

  errorDetailsFromResult(finalResult, preliminaryResult) {
    const testExceptionComments = _.uniq([
      ..._.get(finalResult, 'resultData.comments', []).filter(comment => comment.type === 'Exception String'),
      ..._.get(preliminaryResult, 'resultData.comments', []).filter(comment => comment.type === 'Exception String'),
    ])
    const testExceptionCodes = _.uniq(testExceptionComments.map(comment => comment.text.split(':')[0].trim()))
    const errorCode = testExceptionCodes.join(',')
    const errorNotes = _.uniq(testExceptionComments.map(comment => comment.text)).join('\n')
    const errorDetails = {}
    if (errorCode) {
      errorDetails.errorCode = errorCode
    }
    if (errorNotes) {
      errorDetails.errorNotes = errorNotes
    }
    return errorDetails
  }

  resultToQcSummaryResult(finalResult, preliminaryResult) {
    return {
      reportType: _.get(finalResult, 'resultData.reportType'),
      finalResultAbnormalFlags: _.get(finalResult, 'resultData.abnormalFlags'),
      preliminaryResultAbnormalFlags: _.get(preliminaryResult, 'resultData.abnormalFlags'),
      result: _.get(finalResult, 'resultData.resultText'),
      moduleName: _.get(finalResult, 'moduleName'),
      assayCode: _.get(finalResult, 'assay.code'),
      assayName: _.get(finalResult, 'resultData.assayName'),
      consumableLot: _.get(finalResult, 'consumableLot'),
      consumableSerial: _.get(finalResult, 'consumableSerial'),
      controlConsumableLotNumber: _.get(finalResult, 'resultData.controlConsumableLotNumber'),
      endedOn: _.get(finalResult, 'endedOn'),
      moduleSerial: _.get(finalResult, 'moduleSerial'),
      orderOperatorId: _.get(finalResult, 'resultData.orderOperatorId'),
      senderOperator: _.get(finalResult, 'senderOperator'),
      cycleNumber: _.get(preliminaryResult, 'resultData.resultText'),
      ...this.errorDetailsFromResult(finalResult, preliminaryResult),
    }
  }

  convertQcResultDetailsToQcSummary(qualityControlResults, assayMappings) {
    return _.uniq(qualityControlResults.map(qualityControlResult => qualityControlResult.assay.code)).reduce(
      (accumulator, assayCode) => {
        const finalResults = qualityControlResults.filter(
          qualityControlResult =>
            qualityControlResult.assay.code === assayCode &&
            qualityControlResult.resultData.resultType === 'Final Result'
        )
        const preliminaryResults = qualityControlResults.filter(
          qualityControlResult =>
            qualityControlResult.assay.code === assayCode &&
            qualityControlResult.resultData.resultType === 'Preliminary Result'
        )
        const negativeQualityControlFinalResult = finalResults.find(
          qualityControlResult =>
            qualityControlResult.sample.externalId === assayMappings[assayCode].negativeControlSpecimenId
        )
        const negativeQualityControlPreliminaryResult = preliminaryResults.find(
          qualityControlResult =>
            qualityControlResult.sample.externalId === assayMappings[assayCode].negativeControlSpecimenId
        )
        if (assayMappings[assayCode].isQuantitative) {
          const highPositiveQualityControlFinalResult = finalResults.find(
            qualityControlResult =>
              qualityControlResult.sample.externalId === assayMappings[assayCode].highPositiveControlSpecimenId
          )
          const highPositiveQualityControlPreliminaryResult = preliminaryResults.find(
            qualityControlResult =>
              qualityControlResult.sample.externalId === assayMappings[assayCode].highPositiveControlSpecimenId
          )
          const lowPositiveQualityControlFinalResult = finalResults.find(
            qualityControlResult =>
              qualityControlResult.sample.externalId === assayMappings[assayCode].lowPositiveControlSpecimenId
          )
          const lowPositiveQualityControlPreliminaryResult = preliminaryResults.find(
            qualityControlResult =>
              qualityControlResult.sample.externalId === assayMappings[assayCode].lowPositiveControlSpecimenId
          )
          const positiveControlPassed = this.quantitativePositiveControlsPassed(
            highPositiveQualityControlFinalResult,
            lowPositiveQualityControlFinalResult
          )
          accumulator[assayCode] = {
            negativeControl: {
              passed: this.negativeControlPassed(negativeQualityControlFinalResult),
              ...this.resultToQcSummaryResult(
                negativeQualityControlFinalResult,
                negativeQualityControlPreliminaryResult
              ),
            },
            highPositiveControl: {
              passed: positiveControlPassed,
              ...this.resultToQcSummaryResult(
                highPositiveQualityControlFinalResult,
                highPositiveQualityControlPreliminaryResult
              ),
            },
            lowPositiveControl: {
              passed: positiveControlPassed,
              ...this.resultToQcSummaryResult(
                lowPositiveQualityControlFinalResult,
                lowPositiveQualityControlPreliminaryResult
              ),
            },
          }
        } else {
          const positiveQualityControlFinalResult = finalResults.find(
            qualityControlResult =>
              qualityControlResult.sample.externalId === assayMappings[assayCode].positiveControlSpecimenId
          )
          const positiveQualityControlPreliminaryResult = preliminaryResults.find(
            qualityControlResult =>
              qualityControlResult.sample.externalId === assayMappings[assayCode].positiveControlSpecimenId
          )
          accumulator[assayCode] = {
            negativeControl: {
              passed: this.negativeControlPassed(negativeQualityControlFinalResult),
              ...this.resultToQcSummaryResult(
                negativeQualityControlFinalResult,
                negativeQualityControlPreliminaryResult
              ),
            },
            positiveControl: {
              passed: this.qualitativePositiveControlsPassed(
                positiveQualityControlFinalResult,
                positiveQualityControlPreliminaryResult
              ),
              ...this.resultToQcSummaryResult(
                positiveQualityControlFinalResult,
                positiveQualityControlPreliminaryResult
              ),
            },
          }
        }
        return accumulator
      },
      {}
    )
  }

  async getOrCreateSample(resultsWithSameId, deviceSiteId, knex) {
    const sampleTypeIds = await allSampleTypeToId()
    const now = new Date()

    let sample = {}
    if (!_.isEmpty(resultsWithSameId)) {
      const result = resultsWithSameId[0]
      const existingSamples = await knex('Sample as s')
        .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
        .where('s.externalId', result.sample.externalId)
        .select('s.id', 's.collectedOn', 's.originSiteId', 'st.externalId as sampleTypeExternalId')
      if (!_.isEmpty(existingSamples)) {
        if (existingSamples.length === 1) {
          ;[sample] = existingSamples
        }
        if (_.isEmpty(sample)) {
          const existingSamplesOfTypeFromDeviceSiteId = _.filter(existingSamples, {
            sampleTypeExternalId: result.sample.sampleTypeExternalId,
            originSiteId: deviceSiteId,
          })
          if (existingSamplesOfTypeFromDeviceSiteId.length === 1) {
            ;[sample] = existingSamplesOfTypeFromDeviceSiteId
          }
        }
        if (_.isEmpty(sample)) {
          const existingSamplesOfType = _.filter(existingSamples, {
            sampleTypeExternalId: result.sample.sampleTypeExternalId,
          })
          if (existingSamplesOfType.length === 1) {
            ;[sample] = existingSamplesOfType
          }
        }
      }
      if (!sample.id) {
        sample = {
          externalId: result.sample.externalId,
          collectedOn: result.sample.collectedOn,
          sampleTypeId: sampleTypeIds[result.sample.sampleTypeExternalId],
          originSiteId: deviceSiteId,
          createdOn: now,
          updatedOn: now,
        }
        const [sampleId] = await knex('Sample').insert(sample)
        sample.id = sampleId
      } else {
        if (result.sample.collectedOn && !dateEqual(sample.collectedOn, result.sample.collectedOn)) {
          sample.collectedOn = result.sample.collectedOn
        }
        if (!sample.originSiteId && deviceSiteId) {
          sample.originSiteId = deviceSiteId
        }
        await knex('Sample')
          .where('id', sample.id)
          .update({
            ..._.omit(sample, ['sampleTypeExternalId']),
            sampleTypeId: sampleTypeIds[sample.sampleTypeExternalId],
            updatedOn: now,
          })
      }
    }
    return sample
  }

  convertASTMResultsWithSameIdAndAssayCodeToResult(
    resultsWithSameId,
    sample,
    assayMappings,
    device,
    deviceApiKey,
    site,
    qualityControlSummaries,
    utcNow,
    resultCategories,
    resultSourceDiagnosticDeviceId,
    resultTypePatientId
  ) {
    if (_.isEmpty(resultsWithSameId)) {
      return {}
    }
    const finalResult = resultsWithSameId.find(result => result.resultData.resultType === 'Final Result')
    const qualityControlSummary = _.get(
      qualityControlSummaries,
      [finalResult.sampleRunNumber, finalResult.assay.code],
      {}
    )
    const passedQualityControl =
      !_.isEmpty(qualityControlSummary) && Object.values(qualityControlSummary).every(control => control.passed)
    const cycleNumberResult = resultsWithSameId.find(result => result.resultData.resultType === 'Preliminary Result')
    const interpretationResult = resultsWithSameId.find(
      result => result.resultData.resultType === 'Interpretation of Final Result'
    )
    const result = _.mergeWith(
      _.cloneDeep(_.omit(cycleNumberResult || {}, ['device', 'sample', 'assay'])),
      _.cloneDeep(_.omit(interpretationResult || {}, ['device', 'sample', 'assay'])),
      _.cloneDeep(_.omit(finalResult, ['device', 'sample', 'assay'])),
      {
        assayId: assayMappings[finalResult.assay.code].id,
        partnerId: deviceApiKey.partnerId,
        siteId: site.id,
        deviceId: device.id,
        longitude: site.longitude,
        latitude: site.latitude,
        resultSourceId: resultSourceDiagnosticDeviceId,
        resultTypeId: resultTypePatientId,
        sampleId: sample.id,
        reportableSiteId: sample.originSiteId || device.defaultReportableSiteId || device.siteId,
        resultData: {
          passedQualityControl,
          qualityControlSummary,
        },
        updatedOn: utcNow,
      }
    )
    if (result.resultData.reportType !== 'Final Result') {
      result.resultCategory1 = resultCategories.Error
      result.resultCategory2 = null
      const testExceptionComments = _.get(result, 'resultData.comments', []).filter(
        comment => comment.type === 'Exception String'
      )
      const testExceptionCodes = _.uniq(testExceptionComments.map(comment => comment.text.split(':')[0].trim()))
      result.errorCode = [...testExceptionCodes].join(',')
      result.errorNotes = _.uniq(testExceptionComments.map(comment => comment.text)).join('\n')
    } else if (!passedQualityControl) {
      result.resultCategory1 = resultCategories.Invalid
      result.resultCategory2 = null
    } else {
      const resultCategoryMapping = _.get(assayMappings, [finalResult.assay.code, 'resultCategories'])
      const interpretationResultText = _.get(interpretationResult, 'resultData.resultText', '')
      const interpretationResultCategoryId = interpretationResult
        ? _.get(resultCategoryMapping, ['I', interpretationResultText])
        : null
      const finalResultText = _.get(finalResult, 'resultData.resultText', '')
      const finalResultCategoryId =
        _.get(resultCategoryMapping, ['F', finalResultText]) ||
        (isNumeric(finalResultText) ? _.get(resultCategoryMapping, `F.Numeric`) : undefined)
      if (interpretationResult) {
        result.resultCategory1 = interpretationResultCategoryId
        result.resultCategory2 = finalResultCategoryId
      } else {
        result.resultCategory1 = finalResultCategoryId
      }
    }
    result.notes = _.uniq((result.resultData.comments || []).map(comment => comment.text)).join('\n')
    return result
  }

  async processViralLoadResultsWithSameId(
    resultsWithSameId,
    assayMappings,
    device,
    deviceApiKey,
    site,
    qualityControlSummaries,
    utcNow,
    resultSourceDiagnosticDeviceId,
    resultTypePatientId,
    resultCategories,
    sample,
    knex
  ) {
    const result = this.convertASTMResultsWithSameIdAndAssayCodeToResult(
      resultsWithSameId,
      sample,
      assayMappings,
      device,
      deviceApiKey,
      site,
      qualityControlSummaries,
      utcNow,
      resultCategories,
      resultSourceDiagnosticDeviceId,
      resultTypePatientId
    )
    return this.mergeResultRecord(result, utcNow, knex)
  }

  async processDaanNCovid19ResultsWithSameId(
    resultsWithSameId,
    assayMappings,
    device,
    deviceApiKey,
    site,
    qualityControlSummaries,
    utcNow,
    resultSourceDiagnosticDeviceId,
    resultTypePatientId,
    resultCategories,
    sample,
    knex
  ) {
    const orf1abGeneResults = resultsWithSameId.filter(result => result.assay.code === 'Daan nCOVID-19 ORF LDA')
    const orf1abGeneResult = this.convertASTMResultsWithSameIdAndAssayCodeToResult(
      orf1abGeneResults,
      sample,
      assayMappings,
      device,
      deviceApiKey,
      site,
      qualityControlSummaries,
      utcNow,
      resultCategories,
      resultSourceDiagnosticDeviceId,
      resultTypePatientId
    )
    const nGeneResults = resultsWithSameId.filter(result => result.assay.code === 'Daan Target N gene LDA')
    const nGeneResult = this.convertASTMResultsWithSameIdAndAssayCodeToResult(
      nGeneResults,
      sample,
      assayMappings,
      device,
      deviceApiKey,
      site,
      qualityControlSummaries,
      utcNow,
      resultCategories,
      resultSourceDiagnosticDeviceId,
      resultTypePatientId
    )

    const resultDetails = {}
    if (
      orf1abGeneResult.resultCategory1 === resultCategories.Error ||
      nGeneResult.resultCategory1 === resultCategories.Error
    ) {
      resultDetails.resultCategory1 = resultCategories.Error
      resultDetails.resultCategory2 = null
      resultDetails.errorCode = _.uniq(
        [...(orf1abGeneResult.errorCode || '').split(','), ...(nGeneResult.errorCode || '').split(',')].filter(
          code => !!code
        )
      ).join(',')
      resultDetails.errorNotes = _.uniq(
        [...(orf1abGeneResult.errorNotes || '').split('\n'), ...(nGeneResult.errorNotes || '').split('\n')].filter(
          note => !!note
        )
      ).join('\n')
    } else if (
      orf1abGeneResult.resultCategory1 === resultCategories.Invalid ||
      nGeneResult.resultCategory1 === resultCategories.Invalid
    ) {
      resultDetails.resultCategory1 = resultCategories.Invalid
      resultDetails.resultCategory2 = null
    } else if (orf1abGeneResult.resultCategory1 !== nGeneResult.resultCategory1) {
      resultDetails.resultCategory1 = resultCategories.Indeterminate
      resultDetails.resultCategory2 = null
    } else {
      resultDetails.resultCategory1 = orf1abGeneResult.resultCategory1
      resultDetails.resultCategory2 = orf1abGeneResult.resultCategory2 || nGeneResult.resultCategory2 || null
    }
    const result = {
      ..._.mergeWith(_.cloneDeep(nGeneResult), _.cloneDeep(orf1abGeneResult), mergeDeep),
      externalId: _.get(orf1abGeneResult, 'externalId') || _.get(nGeneResult, 'externalId'),
      ...resultDetails,
    }
    result.resultData.qualityControlSummary = {
      'Daan nCOVID-19 ORF LDA': _.get(orf1abGeneResult, 'resultData.qualityControlSummary'),
      'Daan Target N gene LDA': _.get(nGeneResult, 'resultData.qualityControlSummary'),
    }
    if (
      !_.get(orf1abGeneResult, 'resultData.passedQualityControl') ||
      !_.get(nGeneResult, 'resultData.passedQualityControl')
    ) {
      result.resultData.passedQualityControl = false
    }
    result.notes = _.uniq(
      [..._.get(orf1abGeneResult, 'notes', '').split('\n'), ..._.get(nGeneResult, 'notes', '').split('\n')].filter(
        note => !!note
      )
    ).join('\n')
    return this.mergeResultRecord(result, utcNow, knex)
  }

  async mergeResultRecord(result, utcNow, knex) {
    const existingResult = await knex('Result')
      .where('externalId', result.externalId)
      .andWhere('deviceId', result.deviceId)
      .first()
    if (existingResult) {
      result.id = existingResult.id
      existingResult.resultData = JSON.parse(existingResult.resultData || '{}')
      existingResult.patientData = JSON.parse(existingResult.patientData || '{}')
      existingResult.formData = JSON.parse(existingResult.formData || '{}')
      if (existingResult.notes) {
        result.notes = _.uniq(`${existingResult.notes}\n${result.notes}`.split('\n')).join('\n')
      }
      Object.assign(existingResult, result)
      await knex('Result')
        .where('id', result.id)
        .update({
          ...existingResult,
          resultData: existingResult.resultData ? JSON.stringify(existingResult.resultData) : null,
          patientData: existingResult.patientData ? JSON.stringify(existingResult.patientData) : null,
          formData: existingResult.formData ? JSON.stringify(existingResult.formData) : null,
        })
    } else {
      result.createdOn = utcNow
      const [resultId] = await knex('Result').insert({
        ...result,
        resultData: result.resultData ? JSON.stringify(result.resultData) : null,
        patientData: result.patientData ? JSON.stringify(result.patientData) : null,
        formData: result.formData ? JSON.stringify(result.formData) : null,
      })
      result.id = resultId
    }
    return result
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    const now = new Date()
    this.response = { deviceApiRawId: this.id }
    if (!payload) {
      throw Boom.badRequest('No payload to process')
    }
    const assayIds = await allAssayToId()
    const resultCategories = await allResultCategoryToId()
    const assayMappings = this.setupAssayMappings(assayIds, resultCategories)
    const remoteAddress = getRemoteAddress(request)
    const sanitisedPayload = DefaultAbbottM2000.sanitisePayload(payload)
    const jsonAstmMessages = astmE1394MessagesToJson(sanitisedPayload)
    const parsedResults = this.convertJsonParsedASTMMessagesToResultDetails(
      jsonAstmMessages,
      assayMappings,
      now,
      remoteAddress
    )
    const unknownAssayCodes = parsedResults
      .map(parsedResult => _.get(parsedResult, 'assay.code'))
      .filter(assayCode => !Object.keys(assayMappings).includes(assayCode))
    if (!_.isEmpty(unknownAssayCodes)) {
      throw Boom.badRequest(`Unknown assay codes: ${_.uniq(unknownAssayCodes).join(', ')}`)
    }
    const resultExternalIds = _.uniq(
      parsedResults
        .filter(parsedResult => _.get(parsedResult, 'resultData.actionCode') === 'Patient Result')
        .map(parsedResult => parsedResult.externalId)
    )

    const qualityControlResults = parsedResults.filter(
      parsedResult => _.get(parsedResult, 'resultData.actionCode') === 'Quality Control Result'
    )

    const qualityControlSummaries = _.uniq(
      qualityControlResults.map(qualityControlResult => qualityControlResult.sampleRunNumber)
    ).reduce((qualityControlSummaries, sampleRunNumber) => {
      const qualityControlResultsForRun = qualityControlResults.filter(
        qualityControlResult => qualityControlResult.sampleRunNumber === sampleRunNumber
      )
      const qualityControlSummariesForRun = this.convertQcResultDetailsToQcSummary(
        qualityControlResultsForRun,
        assayMappings
      )
      qualityControlSummaries[sampleRunNumber] = qualityControlSummariesForRun
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
              .filter(parsedResult => !_.isEmpty(_.get(parsedResult, 'device.comments')))
              .map(parsedResult => _.get(parsedResult, 'device.comments'))
          ),
          enquiries: _.uniq(
            parsedResults
              .filter(parsedResult => !_.isEmpty(_.get(parsedResult, 'device.enquiries')))
              .map(parsedResult => _.get(parsedResult, 'device.enquiries'))
          ),
        },
      },
      mergeDeep
    )

    await transact(async knex => {
      const deviceApiKey =
        (await knex('DeviceApiKey as dak')
          .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
          .where('dak.token', auth.credentials.token)
          .first('dak.*', 'd.id as linkedDeviceId')) || {}
      const deviceId = deviceApiKey.linkedDeviceId || deviceApiKey.deviceId
      if (!deviceId) {
        throw Boom.badRequest('Invalid device API key: Cannot determine which device this came from')
      }
      const deviceRecord = await knex('Device').where('id', deviceId).first()
      const device = {
        ...deviceRecord,
        configurationData: JSON.parse(deviceRecord.configurationData),
      }
      const site = (await knex('Site').where('id', device.siteId).first()) || {}
      this.response.deviceId = device.id
      this.response.deviceLogIds = []
      if (deviceDetailsInPayload.lastSeenOn >= device.lastSeenOn) {
        const deviceUpdates = _.mergeWith(
          _.cloneDeep(device),
          _.cloneDeep(_.omit(deviceDetailsInPayload, ['comments', 'enquiries', 'rawData'])),
          { updatedOn: now },
          mergeDeep
        )
        if (!_.isNil(deviceUpdates.configurationData)) {
          deviceUpdates.configurationData = JSON.stringify(deviceUpdates.configurationData)
        }
        await knex('Device').where('id', device.id).update(deviceUpdates)
        const [configDeviceLogId] = await knex('DeviceLog').insert({
          deviceApiKeyId: deviceApiKey.id,
          source: this.name,
          deviceConfigurationUpdated: true,
          createdOn: now,
          senderIp: remoteAddress,
          rawMessage: deviceDetailsInPayload.rawData,
        })
        this.response.deviceLogIds = [...this.response.deviceLogIds, configDeviceLogId]
        if (!_.isEmpty(deviceDetailsInPayload.comments)) {
          const commentDeviceLogIds = await Promise.each(deviceDetailsInPayload.comments, async comment => {
            const [commentDeviceLogId] = await knex('DeviceLog').insert({
              deviceApiKeyId: deviceApiKey.id,
              source: this.name,
              createdOn: now,
              senderIp: remoteAddress,
              rawMessage: comment.rawData,
            })
            return commentDeviceLogId
          })
          this.response.deviceLogIds = [...this.response.deviceLogIds, ...commentDeviceLogIds]
        }
        if (!_.isEmpty(deviceDetailsInPayload.enquiries)) {
          const enquiryDeviceLogIds = await Promise.each(deviceDetailsInPayload.enquiries, async comment => {
            const [enquiryDeviceLogId] = await knex('DeviceLog').insert({
              deviceApiKeyId: deviceApiKey.id,
              source: this.name,
              createdOn: now,
              senderIp: remoteAddress,
              rawMessage: comment.rawData,
            })
            return enquiryDeviceLogId
          })
          this.response.deviceLogIds = [...this.response.deviceLogIds, ...enquiryDeviceLogIds]
        }
      }
      this.messageContext.dispatch(deviceSeen(device.id))
      await Promise.each(resultExternalIds, async resultExternalId => {
        const resultsWithSameId = parsedResults.filter(parsedResult => parsedResult.externalId === resultExternalId)
        const assayCode = _.get(resultsWithSameId, '[0]assay.code')
        const resultSourceDiagnosticDeviceId = await resultSourceToId('DiagnosticDevice')
        const resultTypePatientId = await resultTypeToId('Patient')
        const resultCategories = await allResultCategoryToId()
        const sample = await this.getOrCreateSample(resultsWithSameId, device.siteId, knex)
        const processResult = _.get(assayMappings, [assayCode, 'processResult'])
        const result = await processResult(
          resultsWithSameId,
          assayMappings,
          device,
          deviceApiKey,
          site,
          qualityControlSummaries,
          now,
          resultSourceDiagnosticDeviceId,
          resultTypePatientId,
          resultCategories,
          sample,
          knex
        )
        const [resultDeviceLogId] = await knex('DeviceLog').insert({
          deviceApiKeyId: deviceApiKey.id,
          source: this.name,
          createdOn: now,
          senderIp: remoteAddress,
          rawMessage: result.rawData,
          resultId: result.id,
        })
        if (result.id) {
          this.messageContext.dispatch(resultLogged(result.id, resultDeviceLogId))
        }
        this.response.deviceLogIds = [...this.response.deviceLogIds, resultDeviceLogId]
        // TODO: Inventory, reduce reagent and control reagent
      })
    })
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = DefaultAbbottM2000
