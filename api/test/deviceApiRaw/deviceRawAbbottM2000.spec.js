const chai = require('chai')
const chaiSubset = require('chai-subset')
const path = require('path')
const _ = require('lodash')
const { convertToTimeZone } = require('date-fns-timezone')
const { knex } = require('../../src/db')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { readTextFile } = require('../../src/shared/io')
const { waitAsyncComplete } = require('../utils/generatorFunctionUtils')
const { waitForIdle } = require('../utils/mqUtils')
const { insertSite } = require('../../src/site/common/db')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

const { assayToId, resultTypeToId, resultSourceToId, resultCategoryToId } = require('../../src/shared/dictionary')

describe('Device API Raw routes for Abbott M2000', () => {
  let latestResultIdBeforeTests
  let latestCaseIdBeforeTests
  let latestPatientIdBeforeTests
  let latestSampleIdBeforeTests

  const deviceApiRawPath = '/device/raw'
  const validApiKeyToken = randomToken()
  let abbottM2000DeviceId
  let abbottM2000SiteId

  before(async () => {
    const now = new Date()
    const { id: userId } = await knex('User').first('id')
    const abbottM2000DeviceType = await knex.from('DeviceType').where('externalId', 'AbbottM2000').first()
    const partner = await knex.from('Partner').where('name', 'Partner One').first()
    const geography = await knex
      .from('Country as c')
      .join('Geography as g', 'g.countryId', 'c.id')
      .where('c.abbreviation', 'US')
      .andWhere('g.stateId', null)
      .andWhere('g.lgaId', null)
      .first('g.*')
    const approvedDeviceApproval = await knex.from('DeviceApproval').where('token', 'approved').first()

    ;[abbottM2000SiteId] = await insertSite(knex, {
      name: 'Some Site for Some Aboott M2000 Device',
      shortName: 'SSFSAM2D',
      externalId: 'SSFSAM2D',
      partnerId: partner.id,
      geographyId: geography.id,
      city: 'Smokey Creek',
      street1: '7 Woodford Reserve',
      zip: '12345',
      longitude: 18.0,
      latitude: 94.0,
      createdOn: now,
      updatedOn: now,
    })
    ;[abbottM2000DeviceId] = await knex('Device').insert({
      partnerId: partner.id,
      siteId: abbottM2000SiteId,
      deviceTypeId: abbottM2000DeviceType.id,
      deviceApprovalId: approvedDeviceApproval.id,
      moduleBayCapacity: 0,
      name: 'Some Abbott M2000 Device',
      shortName: 'Abbott M2000',
      configurationData: '{}',
      putInService: now,
      lastSeenOn: now,
      createdOn: now,
      updatedOn: now,
    })
    await knex('DeviceApiKey').insert({
      token: validApiKeyToken,
      partnerId: partner.id,
      deviceId: abbottM2000DeviceId,
      siteId: abbottM2000SiteId,
      revoked: false,
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
    })
    ;({ id: latestSampleIdBeforeTests } = await knex('Sample').max('id as id').first())
    ;({ id: latestResultIdBeforeTests } = await knex('Result').max('id as id').first())
    ;({ id: latestCaseIdBeforeTests } = await knex('PatientCase').max('id as id').first())
    ;({ id: latestPatientIdBeforeTests } = await knex('Patient').max('id as id').first())
  })

  after(async () => {
    await waitAsyncComplete()
    const {
      id: deviceApiKeyId,
      deviceId,
      siteId,
    } = await knex('DeviceApiKey as dak')
      .leftJoin('Device as d', 'dak.deviceId', 'd.id')
      .where('dak.token', validApiKeyToken)
      .first('dak.id', 'dak.deviceId', 'd.siteId')
    const resultIds = await knex('Result').where('deviceId', deviceId).pluck('id')
    const opIds = await knex('DeviceOperation').where('deviceId', deviceId).pluck('id')
    const issueIds = await knex('Issue').where('deviceId', deviceId).pluck('id')
    await knex('DeviceApprovalLog').where('deviceId', deviceId).delete()
    await knex('DeviceLog').where('deviceId', deviceId).orWhereIn('resultId', resultIds).delete()
    await knex('DeviceOperation').whereIn('id', opIds).delete()
    await knex('FactDeviceFlag').where('deviceId', deviceId).delete()
    await knex('DeviceSiteHistory').where('deviceId', deviceId).delete()
    await knex('FactResultsDevice').where('deviceId', deviceId).delete()
    await knex('FactResultsDeviceByAssay').where('deviceId', deviceId).delete()
    await knex('FactResultsDeviceByCategory1').where('deviceId', deviceId).delete()
    await knex('InventoryLog').whereIn('resultId', resultIds).delete()
    await knex('ResultQualityControlLog').whereIn('resultId', resultIds).delete()
    await knex('ResultWorkflowLog').whereIn('resultId', resultIds).delete()
    await knex('ResultTag').whereIn('resultId', resultIds).delete()
    await knex('Result').whereIn('id', resultIds).delete()
    const sampleIds = await knex('Result').whereIn('id', resultIds).pluck('sampleId')
    await knex('Sample').whereIn('id', sampleIds).delete()
    await knex('Sample').where('originSiteId', siteId).delete()
    await knex('DeviceApiRaw').where({ deviceApiKeyId }).delete()
    await knex('DeviceApiKey').where('token', validApiKeyToken).orWhere('deviceId', deviceId).delete()
    await knex('Device').where('id', deviceId).delete()
    await knex('Site').where('id', siteId).delete()
    const inventoryItemIds = await knex('InventoryItem as ii')
      .where('ii.siteId', siteId)
      .distinct('ii.id')
      .pluck('ii.id')
    await knex('InventoryLog').whereIn('inventoryItemId', inventoryItemIds).delete()
    await knex('InventoryItem').whereIn('id', inventoryItemIds).delete()
    await knex('IssueEvent')
      .whereIn('issueId', issueIds)
      .orWhere(function () {
        if (resultIds != null && resultIds.length > 0) {
          this.whereRaw(`JSON_EXTRACT(data, "$.resultId") IN (${resultIds.join(',')})`)
        }
      })
      .delete()

    await knex('Result').where('id', '>', latestResultIdBeforeTests).del()
    await knex('Sample').where('id', '>', latestSampleIdBeforeTests).del()
    await knex('PatientCase').where('id', '>', latestCaseIdBeforeTests).del()
    if (latestPatientIdBeforeTests) {
      await knex('Patient').where('id', '>', latestPatientIdBeforeTests).del()
    } else {
      await knex('Patient').del()
    }
  })

  it('should throw an error on unknown assay', async () => {
    const payload = `(lp1
(lp2
S'1H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\\r\x0392\\r\\n'
p3
aS'2P|1\\r\x033F\\r\\n'
p4
aS'3O|1|HIV_NEG|HIV_NEG^vl110^A1|^^^UnknownCode^HIV1.0mlDBS|||||||Q||||||||||||||F\\r\x03D0\\r\\n'
p5
aS'4R|1|^^^UnknownCode^HIV1.0mlDBS^466746^11176551^468347^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695\\r\x03E2\\r\\n'
p6
aS'5R|2|^^^UnknownCode^HIV1.0mlDBS^466746^11176551^468347^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695\\r\x0343\\r\\n'
p7
aS'6L|1\\r\x033F\\r\\n'
p8
aS'7H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\\r\x0398\\r\\n'
p9
aa(lp10
S'0P|1\\r\x033D\\r\\n'
p11
aS'1O|1|HIV_LOPOS|HIV_LOPOS^vl110^B1|^^^UnknownCode^HIV1.0mlDBS|||||||Q||||||||||||||F\\r\x0335\\r\\n'
p12
aS'2R|1|^^^UnknownCode^HIV1.0mlDBS^466746^11176551^468347^F|80332|Copies / mL|14791 TO 467735|OPEN||F||bryan^bryan||20190825165311|275021695\\r\x0376\\r\\n'
p13
aS'3R|2|^^^UnknownCode^HIV1.0mlDBS^466746^11176551^468347^P|22.09|cycle number||||F||bryan^bryan||20190825165311|275021695\\r\x0350\\r\\n'
p14
aS'4L|1\\r\x033D\\r\\n'
p15
aS'5H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\\r\x0396\\r\\n'
p16
aS'6P|1\\r\x0343\\r\\n'
p17
aS'7O|1|HIV_HIPOS|HIV_HIPOS^vl110^C1|^^^UnknownCode^HIV1.0mlDBS|||||||Q||||||||||||||F\\r\x0328\\r\\n'
p18
aa(lp19
S'0R|1|^^^UnknownCode^HIV1.0mlDBS^466746^11176551^468347^F|8427744|Copies / mL|1445440 TO 45708821|OPEN||F||bryan^bryan||20190825165311|275021695\\r\x03AB\\r\\n'
p20
aS'1R|2|^^^UnknownCode^HIV1.0mlDBS^466746^11176551^468347^P|15.49|cycle number||||F||bryan^bryan||20190825165311|275021695\\r\x0354\\r\\n'
p21
aS'2L|1\\r\x033B\\r\\n'
p22
aS'3H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312\\r\x0394\\r\\n'
p23
aS'4P|1\\r\x0341\\r\\n'
p24
aS'5O|1|SYS123165|SYS123165^vl110^D1|^^^UnknownCode^HIV1.0mlDBS|||20190823101300||||||||||||||||||F\\r\x037A\\r\\n'
p25
aS'6R|1|^^^UnknownCode^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695\\r\x03A4\\r\\n'
p26
aS'7R|2|^^^UnknownCode^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695\\r\x0393\\r\\n'
p27
aa(lp28
S'0R|3|^^^UnknownCode^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695\\r\x03FF\\r\\n'
p29
aS'1L|1\\r\x033A\\r\\n'
p30
aa.`
    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .set('Content-type', 'text/plain')
      .send(payload)
    assert.equal(response.statusCode, 400)
  })

  it('should parse the ASTM PKL messages and save the results in the database', async () => {
    const payload = await readTextFile(path.join(__dirname, 'abbottM2000DbsHivVl.pkl'), 'utf8')

    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .set('Content-type', 'text/plain')
      .send(payload)
    assert.equal(response.statusCode, 200)

    assert.equal(response.body.deviceId, abbottM2000DeviceId)
    // make sure that result IDs were set in the device log entries
    const deviceLogs = await knex('DeviceLog').whereIn('id', response.body.deviceLogIds).select()
    // Result update/insert device logs
    const resultIds = _.uniq(
      deviceLogs.filter(deviceLog => !_.isNull(deviceLog.resultId)).map(deviceLog => deviceLog.resultId)
    )
    expect(resultIds).to.have.lengthOf.above(1)
    expect(resultIds).to.have.lengthOf(93)

    // inspect that the results that were created have the expected values:
    const results = await knex('Result').whereIn('id', resultIds).select()

    const site = await knex('Site')
      .where({
        id: abbottM2000SiteId,
      })
      .first()
    const expectedAssayId = await assayToId('abbottM2000DBSHivVL')
    const expectedResultSourceId = await resultSourceToId('DiagnosticDevice')
    const expectedResultTypeId = await resultTypeToId('Patient')
    const errorResultCategoryId = await resultCategoryToId('Error')
    results.forEach(result => {
      expect(result.assayId).to.equal(expectedAssayId)
      expect(result.partnerId).to.equal(site.partnerId)
      expect(result.siteId).to.equal(abbottM2000SiteId)
      expect(result.deviceId).to.equal(abbottM2000DeviceId)
      expect(result.longitude).to.equal(site.longitude)
      expect(result.latitude).to.equal(site.latitude)
      expect(result.resultSourceId).to.equal(expectedResultSourceId)
      expect(result.resultTypeId).to.equal(expectedResultTypeId)
      if (result.resultCategory1 !== errorResultCategoryId) {
        expect(result.endedOn.getTime()).to.equal(
          convertToTimeZone(new Date(2019, 7, 25, 16, 53, 11), {
            timeZone: 'UTC',
          }).getTime()
        )
        expect(result.consumableSerial).to.equal('11176551')
      }
      expect(result.senderVersion).to.equal('1')
      expect(result.updatedOn.getTime()).to.be.closeTo(new Date().getTime(), 15000)
      const resultData = JSON.parse(result.resultData)
      expect(resultData).to.containSubset({
        typeOfMessage: 'Production',
        messageIsComplete: true,
        assayName: 'HIV1.0mlDBS',
        actionCode: 'Patient Result',
        resultType: 'Final Result',
        abnormalFlags: [],
        passedQualityControl: true,
        qualityControlSummary: {
          negativeControl: {
            passed: true,
            reportType: 'Final Result',
            finalResultAbnormalFlags: ['OPEN'],
            preliminaryResultAbnormalFlags: [],
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
            cycleNumber: '-1.00',
          },
          lowPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            finalResultAbnormalFlags: ['OPEN'],
            preliminaryResultAbnormalFlags: [],
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
            cycleNumber: '22.09',
          },
          highPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            finalResultAbnormalFlags: ['OPEN'],
            preliminaryResultAbnormalFlags: [],
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
            cycleNumber: '15.49',
          },
        },
      })
    })
  })

  it('should parse the ASTM RAW messages from an HIV Plasma VL plate, using HIV 0.2ml reagent protocol, and save the results in the database', async () => {
    const payload = await readTextFile(path.join(__dirname, 'abbottM2000PlasmaHivVlRaw.pkl'), 'utf8')
    let patientCase = await knex('PatientCase').where('externalId', '36008/19').first()
    assert.isNotOk(patientCase)
    let patient = await knex('Patient').where('externalId', '36008/19').first()
    assert.isNotOk(patient)
    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .set('Content-type', 'text/plain')
      .send(payload)
    assert.equal(response.statusCode, 200)

    assert.equal(response.body.deviceId, abbottM2000DeviceId)
    // make sure that result IDs were set in the device log entries
    const deviceLogs = await knex('DeviceLog').whereIn('id', response.body.deviceLogIds).select()
    // Result update/insert device logs
    const resultIds = _.uniq(
      deviceLogs.filter(deviceLog => !_.isNull(deviceLog.resultId)).map(deviceLog => deviceLog.resultId)
    )
    expect(resultIds).to.have.lengthOf.above(1)
    expect(resultIds).to.have.lengthOf(93)

    // inspect that the results that were created have the expected values:
    const results = await knex('Result').whereIn('id', resultIds).select()

    const site = await knex('Site')
      .where({
        id: abbottM2000SiteId,
      })
      .first()
    const expectedAssayId = await assayToId('abbottM2000PlasmaHivVL')
    const expectedResultSourceId = await resultSourceToId('DiagnosticDevice')
    const expectedResultTypeId = await resultTypeToId('Patient')
    const errorResultCategoryId = await resultCategoryToId('Error')
    results.forEach(result => {
      expect(result.assayId).to.equal(expectedAssayId)
      expect(result.partnerId).to.equal(site.partnerId)
      expect(result.siteId).to.equal(abbottM2000SiteId)
      expect(result.deviceId).to.equal(abbottM2000DeviceId)
      expect(result.longitude).to.equal(site.longitude)
      expect(result.latitude).to.equal(site.latitude)
      expect(result.resultSourceId).to.equal(expectedResultSourceId)
      expect(result.resultTypeId).to.equal(expectedResultTypeId)
      if (result.resultCategory1 !== errorResultCategoryId) {
        expect(result.endedOn.getTime()).to.equal(
          convertToTimeZone(new Date(2019, 10, 15, 22, 33, 51), {
            timeZone: 'UTC',
          }).getTime()
        )
        expect(result.consumableSerial).to.equal('11763671')
      }
      expect(result.senderVersion).to.equal('1')
      expect(result.updatedOn.getTime()).to.be.closeTo(new Date().getTime(), 15000)
      const resultData = JSON.parse(result.resultData)
      expect(resultData).to.containSubset({
        typeOfMessage: 'Production',
        messageIsComplete: true,
        assayName: 'HIV0.2ml',
        actionCode: 'Patient Result',
        resultType: 'Final Result',
        abnormalFlags: [],
        passedQualityControl: true,
        qualityControlSummary: {
          negativeControl: {
            passed: true,
            reportType: 'Final Result',
            finalResultAbnormalFlags: [],
            preliminaryResultAbnormalFlags: [],
            result: 'Not detected',
            moduleName: 'C1',
            assayCode: 'HIV0.2ml',
            assayName: 'HIV0.2ml',
            consumableLot: '488445',
            consumableSerial: '11763671',
            controlConsumableLotNumber: '488990',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: '-1.00',
          },
          lowPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            finalResultAbnormalFlags: [],
            preliminaryResultAbnormalFlags: [],
            result: '832',
            moduleName: 'B1',
            assayCode: 'HIV0.2ml',
            assayName: 'HIV0.2ml',
            consumableLot: '488445',
            consumableSerial: '11763671',
            controlConsumableLotNumber: '488990',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: '25.28',
          },
          highPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            finalResultAbnormalFlags: [],
            preliminaryResultAbnormalFlags: [],
            result: '109603',
            moduleName: 'A1',
            assayCode: 'HIV0.2ml',
            assayName: 'HIV0.2ml',
            consumableLot: '488445',
            consumableSerial: '11763671',
            controlConsumableLotNumber: '488990',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: '18.18',
          },
        },
      })
    })
    await waitForIdle(2000)
    patientCase = await knex('PatientCase').where('externalId', '36008/19').first()
    patient = await knex('Patient').where('externalId', '36008/19').first()
    expect(patientCase).to.containSubset({
      reliable: 0,
      patientId: patient.id,
    })
  })

  it('should parse the ASTM RAW messages from an HBV Plasma VL plate, using HBV 0.2ml reagent protocol, and save the results in the database', async () => {
    const payload = await readTextFile(path.join(__dirname, 'abbottM2000PlasmaHbvVlRaw.pkl'), 'utf8')

    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .set('Content-type', 'text/plain')
      .send(payload)
    assert.equal(response.statusCode, 200)

    assert.equal(response.body.deviceId, abbottM2000DeviceId)
    // make sure that result IDs were set in the device log entries
    const deviceLogs = await knex('DeviceLog').whereIn('id', response.body.deviceLogIds).select()
    // Result update/insert device logs
    const resultIds = _.uniq(
      deviceLogs.filter(deviceLog => !_.isNull(deviceLog.resultId)).map(deviceLog => deviceLog.resultId)
    )
    expect(resultIds).to.have.lengthOf.above(1)
    expect(resultIds).to.have.lengthOf(45)

    // inspect that the results that were created have the expected values:
    const results = await knex('Result').whereIn('id', resultIds).select()

    const site = await knex('Site')
      .where({
        id: abbottM2000SiteId,
      })
      .first()
    const expectedAssayId = await assayToId('abbottM2000PlasmaHbvVL')
    const expectedResultSourceId = await resultSourceToId('DiagnosticDevice')
    const expectedResultTypeId = await resultTypeToId('Patient')
    const errorResultCategoryId = await resultCategoryToId('Error')
    results.forEach(result => {
      expect(result.assayId).to.equal(expectedAssayId)
      expect(result.partnerId).to.equal(site.partnerId)
      expect(result.siteId).to.equal(abbottM2000SiteId)
      expect(result.deviceId).to.equal(abbottM2000DeviceId)
      expect(result.longitude).to.equal(site.longitude)
      expect(result.latitude).to.equal(site.latitude)
      expect(result.resultSourceId).to.equal(expectedResultSourceId)
      expect(result.resultTypeId).to.equal(expectedResultTypeId)
      if (result.resultCategory1 !== errorResultCategoryId) {
        expect(result.endedOn.getTime()).to.equal(
          convertToTimeZone(new Date(2019, 10, 7, 18, 8, 37), {
            timeZone: 'UTC',
          }).getTime()
        )
        expect(result.consumableSerial).to.equal('11832001')
      }
      expect(result.senderVersion).to.equal('1')
      expect(result.updatedOn.getTime()).to.be.closeTo(new Date().getTime(), 15000)
      const resultData = JSON.parse(result.resultData)
      expect(resultData).to.containSubset({
        typeOfMessage: 'Production',
        messageIsComplete: true,
        assayName: 'HBV 0.2ml',
        actionCode: 'Patient Result',
        resultType: 'Final Result',
        abnormalFlags: [],
        passedQualityControl: true,
        qualityControlSummary: {
          negativeControl: {
            passed: true,
            reportType: 'Final Result',
            finalResultAbnormalFlags: [],
            preliminaryResultAbnormalFlags: [],
            result: 'Not detected',
            moduleName: 'C1',
            assayCode: 'HBV 0.2ml',
            assayName: 'HBV 0.2ml',
            consumableLot: '488761',
            consumableSerial: '11832001',
            controlConsumableLotNumber: '488125',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: '-1.00',
          },
          lowPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            finalResultAbnormalFlags: [],
            preliminaryResultAbnormalFlags: [],
            result: '664',
            moduleName: 'B1',
            assayCode: 'HBV 0.2ml',
            assayName: 'HBV 0.2ml',
            consumableLot: '488761',
            consumableSerial: '11832001',
            controlConsumableLotNumber: '488125',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: '33.58',
          },
          highPositiveControl: {
            passed: true,
            reportType: 'Final Result',
            finalResultAbnormalFlags: [],
            preliminaryResultAbnormalFlags: [],
            result: '42689',
            moduleName: 'A1',
            assayCode: 'HBV 0.2ml',
            assayName: 'HBV 0.2ml',
            consumableLot: '488761',
            consumableSerial: '11832001',
            controlConsumableLotNumber: '488125',
            moduleSerial: '275020369',
            orderOperatorId: 'fse',
            senderOperator: 'Administrator',
            cycleNumber: '27.15',
          },
        },
      })
    })
  })
})
