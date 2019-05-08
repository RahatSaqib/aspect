const supertest = require('supertest')
const chai = require('chai')
const { knex } = require('../../src/db')
const { getUtcTime } = require('../../src/shared/date')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { waitAsyncComplete } = require('../utils/generatorFunctionUtils')
const { deviceApiRawStatusToId } = require('../../src/shared/dictionary')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Device API Raw routes for BD MGIT', () => {
  const deviceApiRawPath = '/device/raw'
  const validApiKeyToken = randomToken()
  let bdMgitDeviceId
  before(async () => {
    const now = getUtcTime()
    const { id: userId } = await knex('User').first('id')
    const bdMgitDeviceType = await knex
      .from('DeviceType')
      .where('externalId', 'BDMGIT')
      .first()
    const partner = await knex
      .from('Partner')
      .where('name', 'Partner One')
      .first()
    const geography = await knex
      .from('Country as c')
      .join('Geography as g', 'g.countryId', 'c.id')
      .where('c.abbreviation', 'US')
      .andWhere('g.stateId', null)
      .andWhere('g.lgaId', null)
      .first('g.*')
    const approvedDeviceStatus = await knex
      .from('DeviceStatus')
      .where('token', 'approved')
      .first()
    const deviceCapacity = await knex('DeviceCapacity')
      .where({ deviceTypeId: bdMgitDeviceType.id })
      .where({ partnerId: partner.id })
      .where({ defaultForDeviceType: 1 })
      .first('id')
    ;[bdMgitDeviceId] = await knex('Device').insert({
      partnerId: partner.id,
      geographyId: geography.id,
      deviceTypeId: bdMgitDeviceType.id,
      deviceCapacityId: deviceCapacity ? deviceCapacity.id : null,
      deviceStatusId: approvedDeviceStatus.id,
      name: 'Some BD MGIT Device',
      shortName: 'BD MGIT',
      configurationData: '{}',
      putInService: now,
      lastSeenOn: now,
      createdOn: now,
      updatedOn: now,
    })
    await knex('DeviceApiKey').insert({
      token: validApiKeyToken,
      deviceId: bdMgitDeviceId,
      revoked: false,
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
    })
  })

  after(async () => {
    await waitAsyncComplete()
    const { id: deviceApiKeyId, deviceId, siteId } = await knex(
      'DeviceApiKey as dak'
    )
      .leftJoin('Device as d', 'dak.deviceId', 'd.id')
      .where('dak.token', validApiKeyToken)
      .first('dak.id', 'dak.deviceId', 'd.siteId')
    const resultIds = await knex('Result')
      .where('deviceId', deviceId)
      .pluck('id')
      .union(function() {
        this.from('ResultGeneratedResult as rgr')
          .innerJoin('Result as r', 'rgr.sourceResultId', 'r.id')
          .where('r.deviceId', deviceId)
          .pluck('generatedResultId as id')
      })
    const opIds = await knex('DeviceOperation')
      .where('deviceId', deviceId)
      .map(op => op.id)
    const issueIds = await knex('Issue')
      .where('deviceId', deviceId)
      .pluck('id')
    await knex('DeviceStatusLog')
      .where('deviceId', deviceId)
      .delete()
    await knex('DeviceLog')
      .where('deviceId', deviceId)
      .orWhereIn('resultId', resultIds)
      .delete()
    await knex('DeviceOperation')
      .whereIn('id', opIds)
      .delete()
    await knex('FactDeviceFlag')
      .where('deviceId', deviceId)
      .delete()
    await knex('DeviceSiteHistory')
      .where('deviceId', deviceId)
      .delete()
    await knex('FactResultsDevice')
      .where('deviceId', deviceId)
      .delete()
    await knex('FactResultsDeviceByAssay')
      .where('deviceId', deviceId)
      .delete()
    await knex('FactResultsDeviceByCategory1')
      .where('deviceId', deviceId)
      .delete()
    await knex('FactResultsDeviceByCategory1And2')
      .where('deviceId', deviceId)
      .delete()
    await knex('DeviceApiRaw')
      .where({ deviceApiKeyId })
      .delete()
    await knex('DeviceApiKey')
      .where('token', validApiKeyToken)
      .orWhere('deviceId', deviceId)
      .delete()
    await knex('Device')
      .where('id', deviceId)
      .delete()
    const inventoryItemIds = await knex('InventoryItem as ii')
      .where('ii.siteId', siteId)
      .distinct('ii.id')
      .pluck('ii.id')
    await knex('InventoryLog')
      .whereIn('inventoryItemId', inventoryItemIds)
      .delete()
    await knex('InventoryItem')
      .whereIn('id', inventoryItemIds)
      .delete()
    await knex('IssueEvent')
      .whereIn('issueId', issueIds)
      .orWhere(function() {
        if (resultIds != null && resultIds.length > 0) {
          this.whereRaw(
            `JSON_EXTRACT(data, "$.resultId") IN (${resultIds.join(',')})`
          )
        }
      })
      .delete()
    await knex('InventoryLog')
      .whereIn('resultId', resultIds)
      .delete()
    await knex('ResultQualityControlLog')
      .whereIn('resultId', resultIds)
      .delete()
    await knex('ResultWorkflowLog')
      .whereIn('resultId', resultIds)
      .delete()
    await knex('ResultGeneratedResult')
      .whereIn('sourceResultId', resultIds)
      .orWhereIn('generatedResultId', resultIds)
      .delete()
    await knex('ResultTag')
      .whereIn('sourceResultId', resultIds)
      .delete()
    await knex('Result')
      .whereIn('id', resultIds)
      .delete()
    await knex('Sample')
      .where('originSiteId', siteId)
      .delete()
    await knex('Site')
      .where('id', siteId)
      .delete()
  })

  it('should save the request in DeviceApiRaw and respond with the record ID', async () => {
    const payload =
      'H|\\^&|||Becton Dickinson|7 Loveton Circle^Sparks^MD^21152||410 316-4000||||P|V1.00|19981019184200\n' +
      'P|1\n' +
      'O|1|0970038018^1||^^^MGIT_960_AST\n' +
      'R|1|^^^AST_MGIT^439309967349^EMB^5.0^ug/ml|INST_ONGOING^123|||||P|||19960502115414|19960502115414|MGIT960^^^13^B/A02\n' +
      'R|2|^^^AST_MGIT^439309967349^RIF^1.0^ug/ml|INST_ONGOING^12|||||P|||19960502115414|19960502115414|MGIT960^^^13^B/A03\n' +
      'L|1|N'
    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .set('Content-type', 'text/plain')
      .send(payload)
    assert.equal(response.statusCode, 200)
    const deviceApiRawRecord = await knex('DeviceApiRaw')
      .where({ id: response.body.deviceApiRawId })
      .first()
    expect(JSON.parse(deviceApiRawRecord.rawData).payload).to.deep.equal(
      payload
    )
    expect(response.body.deviceId).to.equal(bdMgitDeviceId)
    expect(response.body.deviceLogId).to.be.above(0)
  })

  it('should process the request data using the correct data processor', async () => {
    const payload = 'Some unexpected payload'
    const response = await server
      .post(deviceApiRawPath)
      .set('Authorization', `Bearer ${validApiKeyToken}`)
      .set('Content-type', 'text/plain')
      .send(payload)
    assert.equal(response.statusCode, 200)
    const deviceApiRawRecord = await knex('DeviceApiRaw')
      .where({ id: response.body.deviceApiRawId })
      .first()
    assert.equal(deviceApiRawRecord.dataProcessor, 'DefaultBDMGIT')
    const processedStatusId = await deviceApiRawStatusToId('Processed')
    expect(deviceApiRawRecord.deviceApiRawStatusId).to.equal(processedStatusId)
  })
})
