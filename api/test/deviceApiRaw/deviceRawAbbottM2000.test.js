const chai = require('chai')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const proxyquire = require('proxyquire')

const { parseDateOrDefault, dateEqual } = require('../../src/shared/date')

const { assert } = chai

describe('Device API Raw Abbott M2000 Data Processor', () => {
  const utcNow = new Date('2019-09-15T08:09:10.123Z')
  let knexSpy
  let DefaultAbbottM2000 = ''
  let dbsHivVlPklPayload = ''

  before(() => {
    knexSpy = table => {
      const where = (...rest) => {
        const finalCall = {
          first: async () => {
            switch (table) {
              case 'DeviceApiKey':
                return Promise.resolve({
                  id: 1,
                  revoked: false,
                  partnerId: 2,
                  deviceId: 3,
                })
              case 'Device':
                return Promise.resolve({
                  id: 4,
                  siteId: 5,
                  geographyId: 6,
                  configurationData: '{}',
                  lastSeenOn: new Date(1990, 1, 13, 7, 30),
                })
              case 'Site':
                return Promise.resolve({
                  id: 7,
                  longitude: 8,
                  latitude: 9,
                })
              case 'Result':
                if (rest[1] === 'SYS123165|275021695|vl110|D1|20190825165311') {
                  return Promise.resolve({
                    id: 10,
                    instrumentSerial: '275021695',
                    moduleSerial: '275021695',
                    senderVersion: '1',
                    resultData: JSON.stringify({
                      typeOfMessage: 'Production',
                      messageIsComplete: true,
                      assayName: 'HIV1.0mlDBS',
                      collectedBy: null,
                      actionCode: 'Patient Result',
                      reportType: 'Final Result',
                      resultType: 'Final Result',
                      referenceRanges: null,
                      abnormalFlags: ['OPEN'],
                      resultText: 'Not detected',
                      resultUnit: 'Copies / mL',
                      resultStatus: 'Final Result',
                      orderOperatorId: 'bryan',
                      controlConsumableLotNumber: null,
                      passedQualityControl: true,
                      qualityControlSummary: {
                        negativeControl: {
                          passed: true,
                          reportType: 'Final Result',
                          abnormalFlags: ['OPEN'],
                          result: 'Not detected',
                          moduleName: 'A1',
                          assayCode: '1mLDBSvOP',
                          assayName: 'HIV1.0mlDBS',
                          consumableLot: '466746',
                          consumableSerial: '11176551',
                          controlConsumableLotNumber: '468347',
                          endedOn: '2019-08-25T14:53:11.000Z',
                          moduleSerial: '275021695',
                          orderOperatorId: 'bryan',
                          senderOperator: 'bryan',
                          cycleNumber: -1,
                        },
                        lowPositiveControl: {
                          passed: true,
                          reportType: 'Final Result',
                          abnormalFlags: ['OPEN'],
                          result: '80332',
                          moduleName: 'B1',
                          assayCode: '1mLDBSvOP',
                          assayName: 'HIV1.0mlDBS',
                          consumableLot: '466746',
                          consumableSerial: '11176551',
                          controlConsumableLotNumber: '468347',
                          endedOn: '2019-08-25T14:53:11.000Z',
                          moduleSerial: '275021695',
                          orderOperatorId: 'bryan',
                          senderOperator: 'bryan',
                          cycleNumber: 22.09,
                        },
                        highPositiveControl: {
                          passed: true,
                          reportType: 'Final Result',
                          abnormalFlags: ['OPEN'],
                          result: '8427744',
                          moduleName: 'C1',
                          assayCode: '1mLDBSvOP',
                          assayName: 'HIV1.0mlDBS',
                          consumableLot: '466746',
                          consumableSerial: '11176551',
                          controlConsumableLotNumber: '468347',
                          endedOn: '2019-08-25T14:53:11.000Z',
                          moduleSerial: '275021695',
                          orderOperatorId: 'bryan',
                          senderOperator: 'bryan',
                          cycleNumber: 15.49,
                        },
                      },
                    }),
                    rawData:
                      'H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\\r\\x0394\\r\\n\nP|1\\r\\x0341\\r\\n\nO|1|SYS123165|SYS123165^vl110^D1|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F\\r\\x037A\\r\\n\nR|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695\\r\\x03A4\\r\\n\nR|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695\\r\\x0393\\r\\n\nR|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695\\r\\x03FF\\r\\n\nL|1\\r\\x033A\\r\\n',
                    sampleRunNumber: 'vl110',
                    moduleName: 'D1',
                    externalId: 'SYS123165|275021695|vl110|D1|20190825165311',
                    consumableLot: '466746',
                    consumableSerial: '11176551',
                    senderOperator: 'bryan',
                    endedOn: '2019-08-25T14:53:11.000Z',
                    patientData: '{}',
                    assayId: 1,
                    partnerId: 2,
                    geographyId: 6,
                    siteId: 7,
                    longitude: 8,
                    latitude: 9,
                    resultSourceId: 7,
                    resultTypeId: 6,
                    sampleId: 1,
                    updatedOn: '2019-09-15T08:09:10.123Z',
                    resultCategory1: 14,
                    errorCode: 'OPEN',
                    notes: '',
                    createdOn: '2019-09-14T08:09:10.123Z',
                  })
                }
                return Promise.resolve()
              default:
                return Promise.resolve({})
            }
          },
          update: async record => {
            console.log(record)
            return Promise.resolve()
          },
        }
        finalCall.andWhere = () => finalCall
        return finalCall
      }
      const knex = {
        where,
        insert: async record => {
          if (record.moduleName === 'D1') {
            console.log(JSON.stringify(record))
          }
          return Promise.resolve([1])
        },
      }
      const join = () => knex
      knex.join = join
      return knex
    }
    const resolveWith = returnValue => async () => Promise.resolve(returnValue)
    DefaultAbbottM2000 = proxyquire(
      '../../src/deviceApiRaw/dataProcessors/abbottM2000',
      {
        '../../db': {
          transact: async transaction => transaction(knexSpy),
        },
        '../../shared/date': {
          parseDateOrDefault,
          getUtcTime: () => utcNow,
          dateEqual,
        },
        '../../shared/dictionary': {
          allAssayToId: resolveWith({
            abbottM2000DBSHivVL: 1,
            abbottM2000PlasmaHivVL: 2,
            abbottM2000HIVEID: 3,
          }),
          allSampleTypeToId: resolveWith({
            DBS: 4,
            Plasma: 5,
          }),
          resultTypeToId: resolveWith(6),
          resultSourceToId: resolveWith(7),
          allResultCategoryToId: resolveWith({
            Detected: 8,
            NotDetected: 9,
            LessThan550: 10,
            MoreThan550: 11,
            LessThan40: 12,
            MoreThan40: 13,
            Error: 14,
          }),
          allResultWorkflowStatusToId: resolveWith({
            Processed: 15,
            OK: 16,
            Ordered: 17,
            InProgress: 18,
            Error: 19,
          }),
        },
      }
    )
    // The example below is an obfuscated copy of a PKL taken
    //   from the Abbott M2000 running HIV Viral Load Tests using
    //   the 1mLDBSvOP HIV1.0mlDBS Assay
    dbsHivVlPklPayload = fs.readFileSync(
      path.join(__dirname, 'abbotM2000DbsHivVl.pkl'),
      'utf8'
    )
  })

  it('should be able to identify whether the payload is a PKL from an M2000 connector', async () => {
    const isM2000Payload = await DefaultAbbottM2000.canProcessRequest({
      payload: dbsHivVlPklPayload,
    })
    assert.isOk(isM2000Payload)
  })

  it('should be able to parse a PKL file into results', async () => {
    const m2000DataProcessorViralLoad = new DefaultAbbottM2000(
      {
        auth: { credentials: { token: 'some device API key' } },
        payload: dbsHivVlPklPayload,
      },
      { dispatch: () => {} }
    )
    await m2000DataProcessorViralLoad.processRequest()
  })
})
