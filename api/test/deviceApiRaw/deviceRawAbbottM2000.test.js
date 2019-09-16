const chai = require('chai')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const _ = require('lodash')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { convertToTimeZone } = require('date-fns-timezone')

const { parseDateOrDefault, dateEqual } = require('../../src/shared/date')

const { assert, expect } = chai

describe('Device API Raw Abbott M2000 Data Processor', () => {
  const utcNow = new Date('2019-09-15T08:09:10.123Z')
  let dbsHivVlPklPayload = ''

  before(() => {
    // The example below is an obfuscated copy of a PKL taken
    //   from the Abbott M2000 running HIV Viral Load Tests using
    //   the 1mLDBSvOP HIV1.0mlDBS Assay
    dbsHivVlPklPayload = fs.readFileSync(
      path.join(__dirname, 'abbotM2000DbsHivVl.pkl'),
      'utf8'
    )
  })

  it('should be able to identify whether the payload is a PKL from an M2000 connector', async () => {
    const DefaultAbbottM2000 = require('../../src/deviceApiRaw/dataProcessors/abbottM2000')
    const isM2000Payload = await DefaultAbbottM2000.canProcessRequest({
      payload: dbsHivVlPklPayload,
    })
    assert.isOk(isM2000Payload)
  })

  const databaseRecords = {
    DeviceApiKey: {
      id: 1,
      revoked: false,
      partnerId: 2,
      deviceId: 3,
    },
    Device: {
      id: 4,
      siteId: 5,
      geographyId: 6,
      configurationData: '{}',
      lastSeenOn: new Date(1990, 1, 13, 7, 30),
    },
    Site: {
      id: 7,
      longitude: 8,
      latitude: 9,
    },
  }
  const existingSamples = {
    SYS123165: {
      id: 571,
      externalId: 'SYS123165',
      collectedOn: new Date(2013, 10, 25, 14, 1),
      sampleTypeId: 4,
      originSiteId: null,
    },
    SYS123607: {
      id: 572,
      externalId: 'SYS123607',
      collectedOn: new Date(2013, 10, 22, 11, 44),
      sampleTypeId: 4,
      originSiteId: null,
    },
  }
  const existingResultRecord = {
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
  }
  const deviceIpAddress = '10.11.12.13'
  const staticDatabaseData = {
    Assay: {
      abbottM2000DBSHivVL: 1,
      abbottM2000PlasmaHivVL: 2,
      abbottM2000HIVEID: 3,
    },
    SampleType: {
      DBS: 4,
      Plasma: 5,
    },
    resultTypeId: 6,
    resultSourceId: 7,
    ResultCategory: {
      Detected: 8,
      NotDetected: 9,
      LessThan550: 10,
      MoreThan550: 11,
      LessThan40: 12,
      MoreThan40: 13,
      Error: 14,
    },
    ResultWorkflowStatus: {
      Processed: 15,
      OK: 16,
      Ordered: 17,
      InProgress: 18,
      Error: 19,
    },
  }
  function mockOutDefaultAbbottM2000(updateSpy, insertSpy) {
    const buildKnexSpy = (updateSpy, insertSpy) => table => {
      const knex = {
        insert: async (...rest) => {
          insertSpy(table, ...rest)
          return Promise.resolve([insertSpy.callCount])
        },
      }
      const where = (...rest) => {
        const finalCall = {
          first: async () => {
            if (
              table === 'Result' &&
              _.get(rest, '1') === existingResultRecord.externalId
            ) {
              return Promise.resolve(existingResultRecord)
            } else if (
              table === 'Sample as s' &&
              existingSamples[_.get(rest, '1')]
            ) {
              return Promise.resolve(existingSamples[_.get(rest, '1')])
            }
            return Promise.resolve(databaseRecords[table])
          },
          update: async (...rest) => {
            updateSpy(table, ...rest)
            return Promise.resolve()
          },
        }
        finalCall.andWhere = () => finalCall
        return finalCall
      }
      knex.where = where
      const join = () => knex
      knex.join = join
      knex.leftJoin = join
      return knex
    }
    const resolveWith = returnValue => async () => Promise.resolve(returnValue)
    return proxyquire('../../src/deviceApiRaw/dataProcessors/abbottM2000', {
      '../../db': {
        transact: async transaction =>
          transaction(buildKnexSpy(updateSpy, insertSpy)),
      },
      '../../shared/date': {
        parseDateOrDefault,
        getUtcTime: () => utcNow,
        dateEqual,
      },
      '../../shared/dictionary': {
        allAssayToId: resolveWith(staticDatabaseData.Assay),
        allSampleTypeToId: resolveWith(staticDatabaseData.SampleType),
        resultTypeToId: resolveWith(staticDatabaseData.resultTypeId),
        resultSourceToId: resolveWith(staticDatabaseData.resultSourceId),
        allResultCategoryToId: resolveWith(staticDatabaseData.ResultCategory),
        allResultWorkflowStatusToId: resolveWith(
          staticDatabaseData.ResultWorkflowStatus
        ),
      },
      '../../shared/request': {
        getRemoteAddress: () => deviceIpAddress,
      },
    })
  }

  it('should be able to parse a PKL file into results', async () => {
    const updateSpy = sinon.spy()
    const insertSpy = sinon.spy()
    const DefaultAbbottM2000 = mockOutDefaultAbbottM2000(updateSpy, insertSpy)
    const m2000DataProcessorViralLoad = new DefaultAbbottM2000(
      {
        auth: { credentials: { token: 'some device API key' } },
        payload: dbsHivVlPklPayload,
      },
      { dispatch: () => {} }
    )
    await m2000DataProcessorViralLoad.processRequest()
    assert.equal(
      m2000DataProcessorViralLoad.response.deviceId,
      databaseRecords.Device.id
    )
    expect(m2000DataProcessorViralLoad.response.deviceLogIds).to.have.lengthOf(
      94
    )
    const insertCalls = insertSpy.getCalls()
    const updateCalls = updateSpy.getCalls()

    const updateDeviceCalls = updateCalls.filter(
      updateCall => updateCall.args[0] === 'Device'
    )
    expect(updateDeviceCalls).to.have.lengthOf(1)
    expect(updateDeviceCalls[0].args[1]).to.containSubset({
      configurationData: {
        comments: [],
        deviceTypeName: 'm2000',
        deviceVersion: '8.0.25.0',
        enquiries: [],
        interfaceVersion: 'H1P1O1R1C1L1',
        softwareVersion: '1',
      },
      lastPingFromIp: deviceIpAddress,
      lastPingOn: utcNow,
      lastSeenOn: convertToTimeZone(new Date(2019, 7, 25, 16, 53, 12), {
        timeZone: 'UTC',
      }),
      rawData:
        'H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\\r\\x0395\\r\\n\nP|1\\r\\x0342\\r\\n\nO|1|SYS123572|SYS123572^vl110^H2|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F\\r\\x0384\\r\\n\nR|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695\\r\\x03A5\\r\\n\nR|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695\\r\\x038C\\r\\n\nR|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number|||F||br|yan^bryan||20190825165311|275021695\\r\\x0300\\r\\n\nL|1\\r\\x033B\\r\\n',
      serial: '275021695',
      siteId: 5,
      updatedOn: utcNow,
    })

    const insertSampleCalls = insertCalls.filter(
      insertCall => insertCall.args[0] === 'Sample'
    )
    const updateSampleCalls = updateCalls.filter(
      updateCall => updateCall.args[0] === 'Sample'
    )
    expect(insertSampleCalls).to.have.lengthOf(91)
    expect(updateSampleCalls).to.have.lengthOf(2)
    expect(updateSampleCalls[0].args[1]).to.containSubset({
      collectedOn: convertToTimeZone(new Date(2019, 7, 23, 10, 13), {
        timeZone: 'UTC',
      }),
    })
    expect(updateSampleCalls[1].args[1]).to.containSubset({
      collectedOn: convertToTimeZone(new Date(2019, 7, 22, 11, 33), {
        timeZone: 'UTC',
      }),
    })

    const insertResultCalls = insertCalls.filter(
      insertCall => insertCall.args[0] === 'Result'
    )
    const updateResultCalls = updateCalls.filter(
      updateCall => updateCall.args[0] === 'Result'
    )
    expect(insertResultCalls).to.have.lengthOf(92)
    expect(updateResultCalls).to.have.lengthOf(insertResultCalls.length + 2)
    const insertedResults = insertResultCalls.map(
      insertResultCall => insertResultCall.args[1]
    )
    const runLevelProperties = insertedResults.map(result => ({
      ..._.pick(result, [
        'instrumentSerial',
        'moduleSerial',
        'senderVersion',
        'sampleRunNumber',
        'partnerId',
        'geographyId',
        'siteId',
        'longitude',
        'latitude',
        'resultSourceId',
      ]),
      resultData: _.pick(result.resultData, ['qualityControlSummary']),
    }))
    const uniqueRunLevelProperties = _.uniqBy(
      runLevelProperties,
      JSON.stringify
    )
    expect(uniqueRunLevelProperties).to.have.lengthOf(1)
    const resultsEndedOn = convertToTimeZone(
      new Date(2019, 7, 25, 16, 53, 11),
      { timeZone: 'UTC' }
    )
    expect(uniqueRunLevelProperties).to.containSubset([
      {
        instrumentSerial: '275021695',
        moduleSerial: '275021695',
        senderVersion: '1',
        resultData: {
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
              endedOn: resultsEndedOn,
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
              endedOn: resultsEndedOn,
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
              endedOn: resultsEndedOn,
              moduleSerial: '275021695',
              orderOperatorId: 'bryan',
              senderOperator: 'bryan',
              cycleNumber: 15.49,
            },
          },
        },
        sampleRunNumber: 'vl110',
        partnerId: databaseRecords.DeviceApiKey.partnerId,
        geographyId: databaseRecords.Device.geographyId,
        siteId: databaseRecords.Site.id,
        longitude: databaseRecords.Site.longitude,
        latitude: databaseRecords.Site.latitude,
        resultSourceId: staticDatabaseData.resultSourceId,
      },
    ])
    expect(_.uniq(insertedResults.map(result => result.id))).to.have.lengthOf(
      92
    )
    const errorResults = insertedResults.filter(
      result =>
        result.resultCategory1 === staticDatabaseData.ResultCategory.Error
    )
    expect(errorResults).to.have.lengthOf(1)
    expect(errorResults).to.containSubset([
      {
        notes:
          '4442 : Internal control cycle number is too high. Valid range is [19.22, 23.22].',
        resultData: {
          reportType: 'Test could not be performed',
          comments: [
            {
              source: 'Instrument',
              text:
                '4442 : Internal control cycle number is too high. Valid range is [19.22, 23.22].',
              type: 'Exception String',
              rawData:
                '\nC|1|I|4442 : Internal control cycle number is too high. Valid range is [19.22, 23.22].|I\\r\\x0391\\r\\n',
            },
          ],
        },
      },
    ])
    expect(
      updateResultCalls.map(updateResultCall => updateResultCall.args[1])
    ).to.containSubset([existingResultRecord])

    const insertResultWorkflowLogCalls = insertCalls.filter(
      insertCall => insertCall.args[0] === 'ResultWorkflowLog'
    )
    expect(insertResultWorkflowLogCalls).to.have.lengthOf(93)
    const insertDeviceLogCalls = insertCalls.filter(
      insertCall => insertCall.args[0] === 'DeviceLog'
    )
    expect(insertDeviceLogCalls).to.have.lengthOf(
      insertResultWorkflowLogCalls.length + 1
    )
  })
})
