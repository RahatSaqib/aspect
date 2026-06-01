const chai = require('chai')
const chaiSubset = require('chai-subset')
const { knex } = require('../../src/db')
const { parseDateOrDefault } = require('../../src/shared/date')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { waitAsyncComplete } = require('../utils/generatorFunctionUtils')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { insertSite } = require('../../src/site/common/db')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

const { assayToId, resultTypeToId, resultSourceToId, resultCategoryToId } = require('../../src/shared/dictionary')

describe('Device API Raw routes for BD MGIT', () => {
  const deviceApiRawPath = '/device/raw'
  const validApiKeyToken = randomToken()
  let bdMgitDeviceId
  let bdMgitSiteId
  before(async () => {
    const now = new Date()
    const { id: userId } = await knex('User').first('id')
    const bdMgitDeviceType = await knex.from('DeviceType').where('externalId', 'BDMGIT').first()
    const partner = await knex.from('Partner').where('name', 'Partner One').first()
    const geography = await knex
      .from('Country as c')
      .join('Geography as g', 'g.countryId', 'c.id')
      .where('c.abbreviation', 'US')
      .andWhere('g.stateId', null)
      .andWhere('g.lgaId', null)
      .first('g.*')
    const approvedDeviceApproval = await knex.from('DeviceApproval').where('token', 'approved').first()

    ;[bdMgitSiteId] = await insertSite(knex, {
      name: 'Some Site for Some BD MGIT Device',
      shortName: 'SSFSBDMD',
      externalId: 'SSFSBDMD',
      partnerId: partner.id,
      geographyId: geography.id,
      city: 'Sparks',
      street1: '7 Loveton Circle',
      zip: '21152',
      longitude: 17.0,
      latitude: 95.0,
      createdOn: now,
      updatedOn: now,
    })
    ;[bdMgitDeviceId] = await knex('Device').insert({
      partnerId: partner.id,
      siteId: bdMgitSiteId,
      deviceTypeId: bdMgitDeviceType.id,
      deviceApprovalId: approvedDeviceApproval.id,
      moduleBayCapacity: 0,
      name: 'Some BD MGIT Device',
      shortName: 'BD MGIT',
      configurationData: '{}',
      putInService: now,
      lastSeenOn: now,
      createdOn: now,
      updatedOn: now,
    })
    const [deviceApiKeyId] = await knex('DeviceApiKey').insert({
      token: validApiKeyToken,
      siteId: bdMgitSiteId,
      revoked: false,
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
      partnerId: partner.id,
    })
    await knex('Device').where('id', bdMgitDeviceId).update({ deviceApiKeyId })
  })

  after(async () => {
    await waitAsyncComplete()
    const {
      id: deviceApiKeyId,
      deviceId,
      siteId,
    } = await knex('DeviceApiKey as dak')
      .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
      .where('dak.token', validApiKeyToken)
      .first('dak.id', 'd.id as deviceId', 'd.siteId')
    const resultIds = await knex('Result').where('deviceId', deviceId).pluck('id')

    const opIds = await knex('DeviceOperation').where('deviceApiKeyId', deviceApiKeyId).pluck('id')
    const issueIds = await knex('Issue').where('deviceId', deviceId).pluck('id')
    await knex('DeviceApprovalLog').where('deviceId', deviceId).delete()
    await knex('DeviceLog').where('deviceApiKeyId', deviceApiKeyId).orWhereIn('resultId', resultIds).delete()
    await knex('DeviceOperation').whereIn('id', opIds).delete()
    await knex('FactDeviceFlag').where('deviceId', deviceId).delete()
    await knex('FactResultsDevice').where('deviceId', deviceId).delete()
    await knex('FactResultsDeviceByAssay').where('deviceId', deviceId).delete()
    await knex('FactResultsDeviceByCategory1').where('deviceId', deviceId).delete()
    await knex('InventoryLog').whereIn('resultId', resultIds).delete()
    await knex('ResultQualityControlLog').whereIn('resultId', resultIds).delete()
    await knex('ResultTag').whereIn('resultId', resultIds).delete()
    const sampleIds = await knex('Result').whereIn('id', resultIds).pluck('sampleId')
    await knex('Result').whereIn('id', resultIds).delete()
    await knex('Sample').whereIn('id', sampleIds).delete()
    await knex('Sample').where('originSiteId', siteId).delete()
    await knex('DeviceApiRaw').where({ deviceApiKeyId }).delete()
    await knex('Device').where('id', deviceId).update({ deviceApiKeyId: null })
    await knex('DeviceApiKey').where('token', validApiKeyToken).delete()
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
  })

  it('should save the request in DeviceApiRaw and respond with the record ID', () =>
    runTestWithKnex(async () => {
      const payload = {
        header: 'H|\\^&|||Becton Dickinson|7 Loveton Circle^Sparks^MD^21152||410 316-4000||||P|V1.00|20191019184200',
        body: `P|1\nO|1|0970038018^1||^^^MGIT_960_AST\nR|1|^^^AST_MGIT^439309967349^EMB^5.0^ug/ml|INST_ONGOING^123|||||P|||20190502115414|20190502135414|MGIT960^^^13^B/A02\nR|2|^^^AST_MGIT^439309967349^RIF^1.0^ug/ml|INST_ONGOING^12|||||P|||20190502115414|20190502135414|MGIT960^^^13^B/A03\nL|1|N`,
      }
      const response = await server
        .post(deviceApiRawPath)
        .set('Authorization', `Bearer ${validApiKeyToken}`)
        .set('Content-type', 'application/json')
        .send(payload)
      assert.equal(response.statusCode, 200)
      const deviceApiRawRecord = await knex('DeviceApiRaw').where({ id: response.body.deviceApiRawId }).first()
      expect(JSON.parse(deviceApiRawRecord.rawData).payload).to.deep.equal(payload)
      expect(response.body.deviceId).to.equal(bdMgitDeviceId)
      expect(response.body.deviceLogId).to.be.above(0)
    }))

  it('should throw an error on uknown assay', async () => {
    const payload = {
      header: 'H|\\^&|||Becton Dickinson|7 Loveton Circle^Sparks^MD^21152||410 316-4000||||P|V1.00|20191019184200',
      body: `P|1\nO|1|XYZ^1||^^^MGIT_960_XYZ\nR|1|^^^XYZ_MGIT^12345678^^^|INST_ONGOING^|||||P|||20190502115414||MGIT960^^^^\nL|1|N`,
    }
    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .set('Content-type', 'application/json')
      .send(payload)
    assert.equal(response.statusCode, 400)
  })

  it('should parse the GND-ASTM message and save the result in the database', () =>
    runTestWithKnex(async () => {
      const payload = {
        header: 'H|\\^&|||Becton Dickinson|7 Loveton Circle^Sparks^MD^21152||410 316-4000||||P|V1.00|20191019184200',
        body: `P|1\nO|1|0970038020||^^^MGIT_960_GND\nR|1|^^^GND_MGIT^430109967351|INST_POSITIVE^1234|||||P|||20190502115414|20190509123456|MGIT960^^42^1^B/A01\nL|1|N`,
      }

      const response = await server
        .post(deviceApiRawPath)
        .set('Authorization', `Bearer ${validApiKeyToken}`)
        .set('Content-type', 'application/json')
        .send(payload)
      assert.equal(response.statusCode, 200)

      // make sure that result ID was set in the device log entry
      const deviceLogRecord = await knex('DeviceLog')
        .where({
          id: response.body.deviceLogId,
        })
        .first()
      expect(deviceLogRecord.resultId).to.be.above(0)

      // inspect that the result that was created has the expected values:
      const result = await knex('Result')
        .where({
          id: deviceLogRecord.resultId,
        })
        .first()

      const site = await knex('Site')
        .where({
          id: bdMgitSiteId,
        })
        .first()

      expect(result.assayId).to.equal(await assayToId('assayBdMgitGnd'))
      expect(result.partnerId).to.equal(site.partnerId)
      expect(result.siteId).to.equal(bdMgitSiteId)
      expect(result.deviceId).to.equal(bdMgitDeviceId)
      expect(result.longitude).to.equal(site.longitude)
      expect(result.latitude).to.equal(site.latitude)
      expect(result.resultSourceId).to.equal(await resultSourceToId('DiagnosticDevice'))
      expect(result.resultTypeId).to.equal(await resultTypeToId('Patient'))
      expect(result.resultCategory1).to.equal(await resultCategoryToId('Detected'))
      expect(result.resultCategory2).to.equal(null)
      expect(result.startedOn.getTime()).to.equal(new Date(2019, 4, 2, 11, 54, 14).getTime())
      expect(result.consumableSerial).to.equal('430109967351')
      expect(result.senderVersion).to.equal('V1.00')
      expect(result.updatedOn.getTime()).to.be.closeTo(new Date().getTime(), 10000)

      // inspect result data
      const resultData = {
        senderName: 'Becton Dickinson',
        versionNumber: 'V1.00',
        messageDateTime: '20191019184200',
        accessionNumber: '0970038020',
        testId: 'MGIT_960_GND',
        resultTypeCode: 'GND_MGIT',
        consumableSequenceNumber: '430109967351',
        preliminaryFinalStatus: 'P',
        testStartDateTime: '20190502115414',
        testEndedDateTime: '20190509123456',
        instrumentType: 'MGIT960',
        protocolLength: '42',
        instrumentNumber: '1',
        instrumentLocation: 'B/A01',
      }
      expect(JSON.parse(result.resultData)).to.deep.equal(resultData)

      // inspect sample record
      const sample = await knex('Sample').where('id', result.sampleId).first()
      expect(sample.externalId).to.equal('0970038020')
      expect(sample.originSiteId).to.equal(bdMgitSiteId)
    }))

  it('should parse the AST-ASTM message and save the result in the database', async () => {
    const payload = {
      header: 'H|\\^&|||Becton Dickinson|7 Loveton Circle^Sparks^MD^21152||410 316-4000||||P|V1.00|20191019184200',
      body: `P|1\nO|1|0970038018^1||^^^MGIT_960_AST\nR|1|^^^AST_MGIT^439309967350^EMB^5.0^ug/ml|INST_ONGOING^123|||||P|||20190503115414|20190503135414|MGIT960^^^13^B/A02\nR|2|^^^AST_MGIT^439309967350^RIF^1.0^ug/ml|INST_ONGOING^12|||||P|||20190503115414|20190503135414|MGIT960^^^13^B/A03\nL|1|N`,
    }

    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .set('Content-type', 'application/json')
      .send(payload)
    assert.equal(response.statusCode, 200)

    // make sure that result ID was set in the device log entry
    const deviceLogRecord = await knex('DeviceLog')
      .where({
        id: response.body.deviceLogId,
      })
      .first()
    expect(deviceLogRecord.resultId).to.be.above(0)

    // inspect that the result that was created has the expected values:
    const result = await knex('Result')
      .where({
        id: deviceLogRecord.resultId,
      })
      .first()

    const site = await knex('Site')
      .where({
        id: bdMgitSiteId,
      })
      .first()

    expect(result.assayId).to.equal(await assayToId('assayBdMgitAst'))
    expect(result.partnerId).to.equal(site.partnerId)
    expect(result.siteId).to.equal(bdMgitSiteId)
    expect(result.deviceId).to.equal(bdMgitDeviceId)
    expect(result.longitude).to.equal(site.longitude)
    expect(result.latitude).to.equal(site.latitude)
    expect(result.resultSourceId).to.equal(await resultSourceToId('DiagnosticDevice'))
    expect(result.resultTypeId).to.equal(await resultTypeToId('Patient'))
    expect(result.resultCategory1).to.equal(await resultCategoryToId('Unknown'))
    expect(result.resultCategory2).to.equal(null)
    expect(result.startedOn.toISOString()).to.equal(
      parseDateOrDefault('20190503115414', {
        formatString: 'yyyyMMddHHmmss',
      }).toISOString()
    )
    expect(result.consumableSerial).to.equal('439309967350')
    expect(result.senderVersion).to.equal('V1.00')
    expect(result.updatedOn.getTime()).to.be.closeTo(new Date().getTime(), 10000)

    // inspect result data
    const resultData = {
      EMB: {
        growthUnits: '123',
        antibioticConcentration: '5.0',
        antibioticConcentrationUnits: 'ug/ml',
      },
      RIF: {
        growthUnits: '12',
        antibioticConcentration: '1.0',
        antibioticConcentrationUnits: 'ug/ml',
      },
      senderName: 'Becton Dickinson',
      versionNumber: 'V1.00',
      messageDateTime: '20191019184200',
      accessionNumber: '0970038018',
      isolateNumber: '1',
      testId: 'MGIT_960_AST',
      resultTypeCode: 'AST_MGIT',
      consumableSequenceNumber: '439309967350',
      preliminaryFinalStatus: 'P',
      testStartDateTime: '20190503115414',
      testEndedDateTime: '20190503135414',
      instrumentType: 'MGIT960',
      protocolLength: '',
      instrumentNumber: '13',
      instrumentLocation: 'B/A02',
    }
    expect(JSON.parse(result.resultData)).to.deep.equal(resultData)

    // inspect sample record
    const sample = await knex('Sample').where('id', result.sampleId).first()
    expect(sample.externalId).to.equal('0970038018')
    expect(sample.originSiteId).to.equal(bdMgitSiteId)
  })
})
