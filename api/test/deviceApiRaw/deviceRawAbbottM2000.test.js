const chai = require('chai')
const path = require('path')
const Promise = require('bluebird')
const _ = require('lodash')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { convertToTimeZone } = require('date-fns-timezone')

const { parseDateOrDefault, dateEqual } = require('../../src/shared/date')

const { assert, expect } = chai

describe('Device API Raw Abbott M2000 Data Processor', () => {
  describe('sanitisePayload', () => {
    it('Should remove PKL headers and footers', () => {
      const payload = `(lp1
(lp2
S'1H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\\r\\x0392\\r\\n'
p3
aS'2P|1\\r\\x033F\\r\\n'
p724
aS'3H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\\r\\x0394\\r\\n'
p725
aS'4P|1\\r\\x0341\\r\\n'
p726
aS'5O|1|SYS123655|SYS123655^vl110^H12|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F\\r\\x03B8\\r\\n'
p727
aS'6R|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695\\r\\x03A4\\r\\n'
p728
aS'7R|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695\\r\\x0393\\r\\n'
p729
aa(lp730
S'0R|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695\\r\\x03FF\\r\\n'
p731
aS'1L|1\\r\\x033A\\r\\n'
p732
aa.
`
      const DefaultAbbottM2000 = require('../../src/deviceApiRaw/dataProcessors/abbottM2000')
      const sanitisedPayload = DefaultAbbottM2000.sanitisePayload(payload)
      assert.equal(
        sanitisedPayload,
        `H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312
P|1
H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312
P|1
O|1|SYS123655|SYS123655^vl110^H12|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F
R|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695
R|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695
R|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695
L|1`
      )
    })

    it('Should remove start & end transmission characters', () => {
      const payload = `1H|\\^&|||m2000^8.1.9.0^275020369^H1P1O1R1C1L1|||||||P|1|20191115223352
60
2P|1
3F
7H|\\^&|||m2000^8.1.9.0^275020369^H1P1O1R1C1L1|||||||P|1|20191115223352
66
0P|1
3D
1O|1|36025/19|36025/19^594^H12|^^^HIV0.2ml^HIV0.2ml|||||||||||||||||||||F
76
2R|1|^^^HIV0.2ml^HIV0.2ml^488445^11763671^^F|Not detected|Copies / mL||||F||fse^Administrator||20191115223351|275020369
BF
3R|2|^^^HIV0.2ml^HIV0.2ml^488445^11763671^^I|Target not detected|||||F||fse^Administrator||20191115223351|275020369
E0
4R|3|^^^HIV0.2ml^HIV0.2ml^488445^11763671^^P|-1.00|cycle number||||F||fse^Administrator||20191115223351|275020369
54
5L|1
3E
`
      const DefaultAbbottM2000 = require('../../src/deviceApiRaw/dataProcessors/abbottM2000')
      const sanitisedPayload = DefaultAbbottM2000.sanitisePayload(payload)
      assert.equal(
        sanitisedPayload,
        `H|\\^&|||m2000^8.1.9.0^275020369^H1P1O1R1C1L1|||||||P|1|20191115223352
P|1
H|\\^&|||m2000^8.1.9.0^275020369^H1P1O1R1C1L1|||||||P|1|20191115223352
P|1
O|1|36025/19|36025/19^594^H12|^^^HIV0.2ml^HIV0.2ml|||||||||||||||||||||F
R|1|^^^HIV0.2ml^HIV0.2ml^488445^11763671^^F|Not detected|Copies / mL||||F||fse^Administrator||20191115223351|275020369
R|2|^^^HIV0.2ml^HIV0.2ml^488445^11763671^^I|Target not detected|||||F||fse^Administrator||20191115223351|275020369
R|3|^^^HIV0.2ml^HIV0.2ml^488445^11763671^^P|-1.00|cycle number||||F||fse^Administrator||20191115223351|275020369
L|1`
      )
    })
  })

  const utcNow = new Date('2019-09-15T08:09:10.123Z')

  const deviceIpAddress = '10.11.12.13'
  const staticDatabaseData = {
    Assay: {
      abbottM2000DBSHivVL: 1,
      abbottM2000PlasmaHivVL: 2,
      abbottM2000HIVEID: 3,
      abbottM2000PlasmaHbvVL: 4,
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
      LessThan150: 10,
      MoreThan150: 11,
      LessThan550: 12,
      MoreThan550: 13,
      LessThan40: 14,
      MoreThan40: 15,
      Error: 16,
    },
    ResultWorkflowStatus: {
      Processed: 15,
      OK: 16,
      Ordered: 17,
      InProgress: 18,
      Error: 19,
    },
  }

  describe('Python string PKL DBS HIV VL', () => {
    let dbsHivVlPklPayload = ''

    before(() => {
      // The example below is an obfuscated copy of a PKL taken
      //   from the Abbott M2000 running HIV Viral Load Tests using
      //   the 1mLDBSvOP HIV1.0mlDBS Assay
      dbsHivVlPklPayload = fs.readFileSync(
        path.join(__dirname, 'abbottM2000DbsHivVl.pkl'),
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
      reportableSiteId: 7,
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
              }
              if (
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
      const resolveWith = returnValue => async () =>
        Promise.resolve(returnValue)
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
      expect(
        m2000DataProcessorViralLoad.response.deviceLogIds
      ).to.have.lengthOf(94)
      const insertCalls = insertSpy.getCalls()
      const updateCalls = updateSpy.getCalls()

      const updateDeviceCalls = updateCalls.filter(
        updateCall => updateCall.args[0] === 'Device'
      )
      expect(updateDeviceCalls).to.have.lengthOf(1)
      const actualDeviceUpdates = updateDeviceCalls[0].args[1]
      actualDeviceUpdates.configurationData = JSON.parse(
        actualDeviceUpdates.configurationData
      )
      expect(actualDeviceUpdates).to.containSubset({
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
        lastSeenOn: utcNow,
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
        resultData: _.pick(JSON.parse(result.resultData), [
          'qualityControlSummary',
        ]),
      }))
      const uniqueRunLevelProperties = _.uniqBy(
        runLevelProperties,
        JSON.stringify
      )
      expect(uniqueRunLevelProperties).to.have.lengthOf(1)
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
      expect(
        _.uniq(insertedResults.map(result => result.externalId))
      ).to.have.lengthOf(92)
      const errorResults = insertedResults
        .filter(
          result =>
            result.resultCategory1 === staticDatabaseData.ResultCategory.Error
        )
        .map(result => ({
          ...result,
          resultData: result.resultData ? JSON.parse(result.resultData) : null,
          patientData: result.patientData
            ? JSON.parse(result.patientData)
            : null,
          formData: result.formData ? JSON.parse(result.formData) : null,
        }))
      expect(errorResults).to.have.lengthOf(1)
      expect(errorResults).to.containSubset([
        {
          errorCode: '4442',
          errorNotes:
            '4442 : Internal control cycle number is too high. Valid range is [19.22, 23.22].',
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
                  '\nC|1|I|4442 : Internal control cycle number is too high. Valid range is [19.22, 23.22].|I',
              },
            ],
          },
        },
      ])
      expect(
        updateResultCalls
          .filter(
            updateResultCall => Object.keys(updateResultCall.args[1]).length > 1
          )
          .map(updateResultCall => ({
            ...updateResultCall.args[1],
            resultData: updateResultCall.args[1].resultData
              ? JSON.parse(updateResultCall.args[1].resultData)
              : null,
            patientData: updateResultCall.args[1].patientData
              ? JSON.parse(updateResultCall.args[1].patientData)
              : null,
            formData: updateResultCall.args[1].formData
              ? JSON.parse(updateResultCall.args[1].formData)
              : null,
          }))
      ).to.containSubset([
        {
          ...existingResultRecord,
          resultData: {
            ...existingResultRecord.resultData,
            messageSentOn: convertToTimeZone(
              new Date(2019, 7, 25, 16, 53, 12),
              {
                timeZone: 'UTC',
              }
            ).toISOString(),
            qualityControlSummary: {
              highPositiveControl: _.omit(
                existingResultRecord.resultData.qualityControlSummary
                  .highPositiveControl,
                ['endedOn']
              ),
              lowPositiveControl: _.omit(
                existingResultRecord.resultData.qualityControlSummary
                  .lowPositiveControl,
                ['endedOn']
              ),
              negativeControl: _.omit(
                existingResultRecord.resultData.qualityControlSummary
                  .negativeControl,
                ['endedOn']
              ),
            },
          },
        },
      ])

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

  describe('Raw Plasma HIV VL', () => {
    let plasmaHivVlPayload = ''

    before(() => {
      plasmaHivVlPayload = fs.readFileSync(
        path.join(__dirname, 'abbottM2000DbsHivVl.pkl'),
        'utf8'
      )
    })

    it('should be able to identify whether the payload is a PKL from an M2000 connector', async () => {
      const DefaultAbbottM2000 = require('../../src/deviceApiRaw/dataProcessors/abbottM2000')
      const isM2000Payload = await DefaultAbbottM2000.canProcessRequest({
        payload: plasmaHivVlPayload,
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
      '36830/19': {
        id: 571,
        externalId: '36830/19',
        collectedOn: new Date(2019, 10, 25, 14, 1),
        sampleTypeId: 5,
        originSiteId: null,
      },
      '36731/19': {
        id: 572,
        externalId: '36731/19',
        collectedOn: new Date(2019, 10, 22, 11, 44),
        sampleTypeId: 5,
        originSiteId: null,
      },
    }
    const existingResultRecord = {
      id: 10,
      instrumentSerial: '275020369',
      moduleSerial: '275020369',
      senderVersion: '1',
      resultData: JSON.stringify({
        typeOfMessage: 'Production',
        messageIsComplete: true,
        assayName: 'HIV0.2ml',
        collectedBy: null,
        actionCode: 'Patient Result',
        reportType: 'Final Result',
        resultType: 'Final Result',
        referenceRanges: null,
        abnormalFlags: ['OPEN'],
        resultText: 'Not detected',
        resultUnit: 'Copies / mL',
        resultStatus: 'Final Result',
        orderOperatorId: 'fse',
        controlConsumableLotNumber: null,
        passedQualityControl: true,
        qualityControlSummary: {
          negativeControl: {
            passed: true,
            reportType: 'Final Result',
            abnormalFlags: ['OPEN'],
            result: 'Not detected',
            moduleName: 'C1',
            assayCode: 'HIV0.2ml',
            assayName: 'HIV0.2ml',
            consumableLot: '488445',
            consumableSerial: '11763671',
            controlConsumableLotNumber: '488990',
            endedOn: '20191115223351 2019-11-15T22:33:51.000Z',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: -1,
          },
          lowPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            abnormalFlags: ['OPEN'],
            result: '832',
            moduleName: 'B1',
            assayCode: 'HIV0.2ml',
            assayName: 'HIV0.2ml',
            consumableLot: '488445',
            consumableSerial: '11763671',
            controlConsumableLotNumber: '488990',
            endedOn: '20191115223351 2019-11-15T22:33:51.000Z',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: 25.28,
          },
          highPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            abnormalFlags: ['OPEN'],
            result: '109603',
            moduleName: 'A1',
            assayCode: 'HIV0.2ml',
            assayName: 'HIV0.2ml',
            consumableLot: '488445',
            consumableSerial: '11763671',
            controlConsumableLotNumber: '488990',
            endedOn: '20191115223351 2019-11-15T22:33:51.000Z',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: 18.18,
          },
        },
      }),
      rawData:
        'H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\\r\\x0394\\r\\n\nP|1\\r\\x0341\\r\\n\nO|1|SYS123165|SYS123165^vl110^D1|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F\\r\\x037A\\r\\n\nR|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695\\r\\x03A4\\r\\n\nR|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695\\r\\x0393\\r\\n\nR|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695\\r\\x03FF\\r\\n\nL|1\\r\\x033A\\r\\n',
      sampleRunNumber: '594',
      moduleName: 'A2',
      externalId: '36717/19|275020369|594|A2|20191115223351',
      consumableLot: '488445',
      consumableSerial: '11763671',
      senderOperator: 'Administrator',
      endedOn: '2019-11-15T22:33:51.000Z',
      patientData: '{}',
      assayId: 2,
      partnerId: 2,
      geographyId: 6,
      siteId: 7,
      longitude: 8,
      latitude: 9,
      resultSourceId: 7,
      resultTypeId: 6,
      sampleId: 1,
      updatedOn: '2019-11-15T22:33:51.123Z',
      resultCategory1: 10,
      notes: '',
      createdOn: '2019-11-15T22:33:51.123Z',
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
      const resolveWith = returnValue => async () =>
        Promise.resolve(returnValue)
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

    it('should be able to parse a RAW ASTM conversation file into results', async () => {
      const updateSpy = sinon.spy()
      const insertSpy = sinon.spy()
      // console.log(plasmaHivVlPayload)
      const DefaultAbbottM2000 = mockOutDefaultAbbottM2000(updateSpy, insertSpy)
      const m2000DataProcessorViralLoad = new DefaultAbbottM2000(
        {
          auth: { credentials: { token: 'some device API key' } },
          payload: plasmaHivVlPayload,
        },
        { dispatch: () => {} }
      )
      await m2000DataProcessorViralLoad.processRequest()
      assert.equal(
        m2000DataProcessorViralLoad.response.deviceId,
        databaseRecords.Device.id
      )
      expect(
        m2000DataProcessorViralLoad.response.deviceLogIds
      ).to.have.lengthOf(94)
      const insertCalls = insertSpy.getCalls()
      const updateCalls = updateSpy.getCalls()

      const updateDeviceCalls = updateCalls.filter(
        updateCall => updateCall.args[0] === 'Device'
      )
      expect(updateDeviceCalls).to.have.lengthOf(1)
      const actualDeviceUpdates = updateDeviceCalls[0].args[1]
      actualDeviceUpdates.configurationData = JSON.parse(
        actualDeviceUpdates.configurationData
      )
      expect(actualDeviceUpdates).to.containSubset({
        configurationData: {
          comments: [],
          deviceTypeName: 'm2000',
          deviceVersion: '8.1.9.0',
          enquiries: [],
          interfaceVersion: 'H1P1O1R1C1L1',
          softwareVersion: '1',
        },
        lastPingFromIp: deviceIpAddress,
        lastPingOn: utcNow,
        lastSeenOn: utcNow,
        serial: '275020369',
        siteId: 5,
        updatedOn: utcNow,
      })

      const insertSampleCalls = insertCalls.filter(
        insertCall => insertCall.args[0] === 'Sample'
      )
      expect(insertSampleCalls).to.have.lengthOf(91)
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
        resultData: _.pick(JSON.parse(result.resultData), [
          'qualityControlSummary',
        ]),
      }))
      const uniqueRunLevelProperties = _.uniqBy(
        runLevelProperties,
        JSON.stringify
      )
      expect(uniqueRunLevelProperties).to.have.lengthOf(1)
      expect(uniqueRunLevelProperties).to.containSubset([
        {
          instrumentSerial: '275020369',
          moduleSerial: '275020369',
          senderVersion: '1',
          resultData: {
            qualityControlSummary: {
              negativeControl: {
                passed: true,
                reportType: 'Final Result',
                abnormalFlags: [],
                result: 'Not detected',
                moduleName: 'C1',
                assayCode: 'HIV0.2ml',
                assayName: 'HIV0.2ml',
                consumableLot: '488445',
                consumableSerial: '11763671',
                controlConsumableLotNumber: '488990',
                endedOn: '2019-11-15T18:33:51.000Z',
                moduleSerial: '275020369',
                orderOperatorId: 'fse',
                senderOperator: 'Administrator',
                cycleNumber: -1,
              },
              lowPositiveControl: {
                passed: true,
                reportType: 'Final Result',
                abnormalFlags: [],
                result: '832',
                moduleName: 'B1',
                assayCode: 'HIV0.2ml',
                assayName: 'HIV0.2ml',
                consumableLot: '488445',
                consumableSerial: '11763671',
                controlConsumableLotNumber: '488990',
                endedOn: '2019-11-15T18:33:51.000Z',
                moduleSerial: '275020369',
                orderOperatorId: 'fse',
                senderOperator: 'Administrator',
                cycleNumber: 25.28,
              },
              highPositiveControl: {
                passed: true,
                reportType: 'Final Result',
                abnormalFlags: [],
                result: '109603',
                moduleName: 'A1',
                assayCode: 'HIV0.2ml',
                assayName: 'HIV0.2ml',
                consumableLot: '488445',
                consumableSerial: '11763671',
                controlConsumableLotNumber: '488990',
                endedOn: '2019-11-15T18:33:51.000Z',
                moduleSerial: '275020369',
                orderOperatorId: 'fse',
                senderOperator: 'Administrator',
                cycleNumber: 18.18,
              },
            },
          },
          sampleRunNumber: '594',
          partnerId: databaseRecords.DeviceApiKey.partnerId,
          geographyId: databaseRecords.Device.geographyId,
          siteId: databaseRecords.Site.id,
          longitude: databaseRecords.Site.longitude,
          latitude: databaseRecords.Site.latitude,
          resultSourceId: staticDatabaseData.resultSourceId,
        },
      ])
      expect(
        _.uniq(insertedResults.map(result => result.externalId))
      ).to.have.lengthOf(92)
      const errorResults = insertedResults
        .filter(
          result =>
            result.resultCategory1 === staticDatabaseData.ResultCategory.Error
        )
        .map(result => ({
          ...result,
          resultData: result.resultData ? JSON.parse(result.resultData) : null,
          patientData: result.patientData
            ? JSON.parse(result.patientData)
            : null,
          formData: result.formData ? JSON.parse(result.formData) : null,
        }))
      expect(errorResults).to.have.lengthOf(6)
      expect(errorResults).to.containSubset([
        {
          resultData: {
            reportType: 'Test could not be performed',
            comments: [
              {
                source: 'Instrument',
                text: '4447 : Insufficient level of Assay reference dye.',
                type: 'Exception String',
                rawData:
                  '\nC|1|I|4447 : Insufficient level of Assay reference dye.|I',
              },
            ],
          },
          errorCode: '4447',
          errorNotes: '4447 : Insufficient level of Assay reference dye.',
          notes: '4447 : Insufficient level of Assay reference dye.',
        },
        {
          resultData: {
            reportType: 'Test could not be performed',
            comments: [
              {
                source: 'Instrument',
                text: '4447 : Insufficient level of Assay reference dye.',
                type: 'Exception String',
                rawData:
                  '\nC|1|I|4447 : Insufficient level of Assay reference dye.|I',
              },
            ],
          },
          errorCode: '4447',
          errorNotes: '4447 : Insufficient level of Assay reference dye.',
          notes: '4447 : Insufficient level of Assay reference dye.',
        },
        {
          resultData: {
            reportType: 'Test could not be performed',
            comments: [
              {
                source: 'Instrument',
                text: '4447 : Insufficient level of Assay reference dye.',
                type: 'Exception String',
                rawData:
                  '\nC|1|I|4447 : Insufficient level of Assay reference dye.|I',
              },
            ],
          },
          errorCode: '4447',
          errorNotes: '4447 : Insufficient level of Assay reference dye.',
          notes: '4447 : Insufficient level of Assay reference dye.',
        },
        {
          resultData: {
            reportType: 'Test could not be performed',
            comments: [
              {
                source: 'Instrument',
                text:
                  '4442 : Internal control cycle number is too high. Valid range is [20.56, 24.56].',
                type: 'Exception String',
                rawData:
                  '\nC|1|I|4442 : Internal control cycle number is too high. Valid range is [20.56, 24.56].|I',
              },
            ],
          },
          errorCode: '4442',
          errorNotes:
            '4442 : Internal control cycle number is too high. Valid range is [20.56, 24.56].',
          notes:
            '4442 : Internal control cycle number is too high. Valid range is [20.56, 24.56].',
        },
        {
          resultData: {
            reportType: 'Test could not be performed',
            comments: [
              {
                source: 'Instrument',
                text: '4457 : Internal control failed.',
                type: 'Exception String',
                rawData: '\nC|1|I|4457 : Internal control failed.|I',
              },
            ],
          },
          errorCode: '4457',
          errorNotes: '4457 : Internal control failed.',
          notes: '4457 : Internal control failed.',
        },
        {
          resultData: {
            reportType: 'Test could not be performed',
            comments: [
              {
                source: 'Instrument',
                text: '4447 : Insufficient level of Assay reference dye.',
                type: 'Exception String',
                rawData:
                  '\nC|1|I|4447 : Insufficient level of Assay reference dye.|I',
              },
            ],
          },
          errorCode: '4447',
          errorNotes: '4447 : Insufficient level of Assay reference dye.',
          notes: '4447 : Insufficient level of Assay reference dye.',
        },
      ])
      expect(
        updateResultCalls
          .filter(
            updateResultCall => Object.keys(updateResultCall.args[1]).length > 1
          )
          .map(updateResultCall => ({
            ...updateResultCall.args[1],
            resultData: updateResultCall.args[1].resultData
              ? JSON.parse(updateResultCall.args[1].resultData)
              : null,
            patientData: updateResultCall.args[1].patientData
              ? JSON.parse(updateResultCall.args[1].patientData)
              : null,
            formData: updateResultCall.args[1].formData
              ? JSON.parse(updateResultCall.args[1].formData)
              : null,
          }))
      ).to.containSubset([
        {
          ...existingResultRecord,
          resultData: {
            ...existingResultRecord.resultData,
            messageSentOn: convertToTimeZone(
              new Date(2019, 10, 15, 22, 33, 52),
              {
                timeZone: 'UTC',
              }
            ).toISOString(),
            qualityControlSummary: {
              highPositiveControl: _.omit(
                existingResultRecord.resultData.qualityControlSummary
                  .highPositiveControl,
                ['endedOn']
              ),
              lowPositiveControl: _.omit(
                existingResultRecord.resultData.qualityControlSummary
                  .lowPositiveControl,
                ['endedOn']
              ),
              negativeControl: _.omit(
                existingResultRecord.resultData.qualityControlSummary
                  .negativeControl,
                ['endedOn']
              ),
            },
          },
        },
      ])

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

  describe('Raw Plasma HBV VL', () => {
    let plasmaHivVlPayload = ''

    before(async () => {
      plasmaHivVlPayload = await readTextFile(
        path.join(__dirname, 'abbottM2000PlasmaHbvVlRaw.pkl'),
        'utf8'
      )
    })

    it('should be able to identify whether the payload is a PKL from an M2000 connector', async () => {
      const DefaultAbbottM2000 = require('../../src/deviceApiRaw/dataProcessors/abbottM2000')
      const isM2000Payload = await DefaultAbbottM2000.canProcessRequest({
        payload: plasmaHivVlPayload,
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
      '444/19': {
        id: 573,
        externalId: '444/19',
        collectedOn: new Date(2019, 10, 25, 14, 1),
        sampleTypeId: 5,
        originSiteId: null,
      },
      '450/19': {
        id: 574,
        externalId: '450/19',
        collectedOn: new Date(2019, 10, 22, 11, 44),
        sampleTypeId: 5,
        originSiteId: null,
      },
    }
    const existingResultRecord = {
      id: 17,
      instrumentSerial: '275020369',
      moduleSerial: '275020369',
      senderVersion: '1',
      resultData: JSON.stringify({
        typeOfMessage: 'Production',
        messageIsComplete: true,
        assayName: 'HBV 0.2ml',
        collectedBy: null,
        actionCode: 'Patient Result',
        reportType: 'Final Result',
        resultType: 'Final Result',
        referenceRanges: null,
        abnormalFlags: [],
        resultText: 'Not detected',
        resultUnit: 'Copies / mL',
        resultStatus: 'Final Result',
        orderOperatorId: 'fse',
        controlConsumableLotNumber: null,
        passedQualityControl: true,
        qualityControlSummary: {
          negativeControl: {
            passed: true,
            reportType: 'Final Result',
            abnormalFlags: [],
            result: 'Not detected',
            moduleName: 'C1',
            assayCode: 'HBV 0.2ml',
            assayName: 'HBV 0.2ml',
            consumableLot: '488445',
            consumableSerial: '11763671',
            controlConsumableLotNumber: '488990',
            endedOn: '20191115223351 2019-11-15T22:33:51.000Z',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: -1,
          },
          lowPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            abnormalFlags: [],
            result: '832',
            moduleName: 'B1',
            assayCode: 'HBV 0.2ml',
            assayName: 'HBV 0.2ml',
            consumableLot: '488445',
            consumableSerial: '11763671',
            controlConsumableLotNumber: '488990',
            endedOn: '20191115223351 2019-11-15T22:33:51.000Z',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: 25.28,
          },
          highPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            abnormalFlags: [],
            result: '109603',
            moduleName: 'A1',
            assayCode: 'HBV 0.2ml',
            assayName: 'HBV 0.2ml',
            consumableLot: '488445',
            consumableSerial: '11763671',
            controlConsumableLotNumber: '488990',
            endedOn: '20191115223351 2019-11-15T22:33:51.000Z',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: 18.18,
          },
        },
      }),
      rawData:
        'H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\nO|1|SYS123165|SYS123165^vl110^D1|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F\nR|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695\nR|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695\nR|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695\nL|1',
      sampleRunNumber: '594',
      moduleName: 'A2',
      externalId: '444/19|275020369|050|H1|20191107180837',
      consumableLot: '488761',
      consumableSerial: '11832001',
      senderOperator: 'Administrator',
      endedOn: '2019-11-07T22:08:37.000Z',
      patientData: '{}',
      assayId: 4,
      partnerId: 2,
      geographyId: 6,
      siteId: 7,
      longitude: 8,
      latitude: 9,
      resultSourceId: 7,
      resultTypeId: 6,
      sampleId: 1,
      updatedOn: '2019-11-07T22:08:51.123Z',
      resultCategory1: 10,
      notes: '',
      createdOn: '2019-11-07T22:08:51.123Z',
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
      const resolveWith = returnValue => async () =>
        Promise.resolve(returnValue)
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

    it('should be able to parse a RAW ASTM conversation file into results', async () => {
      const updateSpy = sinon.spy()
      const insertSpy = sinon.spy()
      // console.log(plasmaHivVlPayload)
      const DefaultAbbottM2000 = mockOutDefaultAbbottM2000(updateSpy, insertSpy)
      const m2000DataProcessorViralLoad = new DefaultAbbottM2000(
        {
          auth: { credentials: { token: 'some device API key' } },
          payload: plasmaHivVlPayload,
        },
        { dispatch: () => {} }
      )
      await m2000DataProcessorViralLoad.processRequest()
      assert.equal(
        m2000DataProcessorViralLoad.response.deviceId,
        databaseRecords.Device.id
      )
      expect(
        m2000DataProcessorViralLoad.response.deviceLogIds
      ).to.have.lengthOf(46)
      const insertCalls = insertSpy.getCalls()
      const updateCalls = updateSpy.getCalls()

      const updateDeviceCalls = updateCalls.filter(
        updateCall => updateCall.args[0] === 'Device'
      )
      expect(updateDeviceCalls).to.have.lengthOf(1)
      const actualDeviceUpdates = updateDeviceCalls[0].args[1]
      actualDeviceUpdates.configurationData = JSON.parse(
        actualDeviceUpdates.configurationData
      )
      expect(actualDeviceUpdates).to.containSubset({
        configurationData: {
          comments: [],
          deviceTypeName: 'm2000',
          deviceVersion: '8.1.9.0',
          enquiries: [],
          interfaceVersion: 'H1P1O1R1C1L1',
          softwareVersion: '1',
        },
        lastPingFromIp: deviceIpAddress,
        lastPingOn: utcNow,
        lastSeenOn: utcNow,
        serial: '275020369',
        siteId: 5,
        updatedOn: utcNow,
      })

      const insertSampleCalls = insertCalls.filter(
        insertCall => insertCall.args[0] === 'Sample'
      )
      expect(insertSampleCalls).to.have.lengthOf(43)
      const insertResultCalls = insertCalls.filter(
        insertCall => insertCall.args[0] === 'Result'
      )
      const updateResultCalls = updateCalls.filter(
        updateCall => updateCall.args[0] === 'Result'
      )
      expect(insertResultCalls).to.have.lengthOf(44)
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
        resultData: _.pick(JSON.parse(result.resultData), [
          'qualityControlSummary',
        ]),
      }))
      const uniqueRunLevelProperties = _.uniqBy(
        runLevelProperties,
        JSON.stringify
      )
      expect(uniqueRunLevelProperties).to.have.lengthOf(1)
      expect(uniqueRunLevelProperties).to.containSubset([
        {
          instrumentSerial: '275020369',
          moduleSerial: '275020369',
          senderVersion: '1',
          resultData: {
            qualityControlSummary: {
              negativeControl: {
                passed: true,
                reportType: 'Final Result',
                abnormalFlags: [],
                result: 'Not detected',
                moduleName: 'C1',
                assayCode: 'HBV 0.2ml',
                assayName: 'HBV 0.2ml',
                consumableLot: '488761',
                consumableSerial: '11832001',
                controlConsumableLotNumber: '488125',
                endedOn: '2019-11-07T14:08:37.000Z',
                moduleSerial: '275020369',
                orderOperatorId: 'fse',
                senderOperator: 'Administrator',
                cycleNumber: -1,
              },
              lowPositiveControl: {
                passed: true,
                reportType: 'Final Result',
                abnormalFlags: [],
                result: '664',
                moduleName: 'B1',
                assayCode: 'HBV 0.2ml',
                assayName: 'HBV 0.2ml',
                consumableLot: '488761',
                consumableSerial: '11832001',
                controlConsumableLotNumber: '488125',
                endedOn: '2019-11-07T14:08:37.000Z',
                moduleSerial: '275020369',
                orderOperatorId: 'fse',
                senderOperator: 'Administrator',
                cycleNumber: 33.58,
              },
              highPositiveControl: {
                passed: true,
                reportType: 'Final Result',
                abnormalFlags: [],
                result: '42689',
                moduleName: 'A1',
                assayCode: 'HBV 0.2ml',
                assayName: 'HBV 0.2ml',
                consumableLot: '488761',
                consumableSerial: '11832001',
                controlConsumableLotNumber: '488125',
                endedOn: '2019-11-07T14:08:37.000Z',
                moduleSerial: '275020369',
                orderOperatorId: 'fse',
                senderOperator: 'Administrator',
                cycleNumber: 27.15,
              },
            },
          },
          sampleRunNumber: '050',
          partnerId: databaseRecords.DeviceApiKey.partnerId,
          geographyId: databaseRecords.Device.geographyId,
          siteId: databaseRecords.Site.id,
          longitude: databaseRecords.Site.longitude,
          latitude: databaseRecords.Site.latitude,
          resultSourceId: staticDatabaseData.resultSourceId,
        },
      ])
      expect(
        _.uniq(insertedResults.map(result => result.externalId))
      ).to.have.lengthOf(44)
      const errorResults = insertedResults
        .filter(
          result =>
            result.resultCategory1 === staticDatabaseData.ResultCategory.Error
        )
        .map(result => ({
          ...result,
          resultData: result.resultData ? JSON.parse(result.resultData) : null,
          patientData: result.patientData
            ? JSON.parse(result.patientData)
            : null,
          formData: result.formData ? JSON.parse(result.formData) : null,
        }))
      expect(errorResults).to.have.lengthOf(0)
      expect(
        updateResultCalls
          .filter(
            updateResultCall => Object.keys(updateResultCall.args[1]).length > 1
          )
          .map(updateResultCall => ({
            ...updateResultCall.args[1],
            resultData: updateResultCall.args[1].resultData
              ? JSON.parse(updateResultCall.args[1].resultData)
              : null,
            patientData: updateResultCall.args[1].patientData
              ? JSON.parse(updateResultCall.args[1].patientData)
              : null,
            formData: updateResultCall.args[1].formData
              ? JSON.parse(updateResultCall.args[1].formData)
              : null,
          }))
      ).to.containSubset([
        {
          ...existingResultRecord,
          resultData: {
            ...existingResultRecord.resultData,
            messageSentOn: convertToTimeZone(new Date(2019, 10, 7, 18, 8, 38), {
              timeZone: 'UTC',
            }).toISOString(),
            qualityControlSummary: {
              highPositiveControl: _.omit(
                existingResultRecord.resultData.qualityControlSummary
                  .highPositiveControl,
                ['endedOn']
              ),
              lowPositiveControl: _.omit(
                existingResultRecord.resultData.qualityControlSummary
                  .lowPositiveControl,
                ['endedOn']
              ),
              negativeControl: _.omit(
                existingResultRecord.resultData.qualityControlSummary
                  .negativeControl,
                ['endedOn']
              ),
            },
          },
        },
      ])

      const insertResultWorkflowLogCalls = insertCalls.filter(
        insertCall => insertCall.args[0] === 'ResultWorkflowLog'
      )
      expect(insertResultWorkflowLogCalls).to.have.lengthOf(45)
      const insertDeviceLogCalls = insertCalls.filter(
        insertCall => insertCall.args[0] === 'DeviceLog'
      )
      expect(insertDeviceLogCalls).to.have.lengthOf(
        insertResultWorkflowLogCalls.length + 1
      )
    })
  })
})
