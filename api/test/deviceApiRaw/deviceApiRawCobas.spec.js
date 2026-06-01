const chai = require('chai')
const chaiSubset = require('chai-subset')
const { run } = require('../../src/db')

const { randomToken } = require('../../src/deviceApi/apiKey')
const { waitAsyncComplete } = require('../utils/generatorFunctionUtils')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { insertSite } = require('../../src/site/common/db')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('Device API Raw routes for cobas', () => {
  // eslint-disable-next-line no-unused-vars
  let apiKeyId
  let deviceId

  const deviceApiRawPath = '/device/raw'
  const validApiKeyToken = randomToken()
  before(() =>
    run(async knex => {
      const now = new Date()
      const { id: userId } = await knex('User').first('id')

      const cobasDeviceType = await knex.from('DeviceType').where('externalId', 'COBAS4800').first()
      const partner = await knex.from('Partner').where('name', 'Partner One').first()
      const geography = await knex
        .from('Country as c')
        .join('Geography as g', 'g.countryId', 'c.id')
        .where('c.abbreviation', 'US')
        .andWhere('g.stateId', null)
        .andWhere('g.lgaId', null)
        .first('g.*')
      const approvedDeviceApproval = await knex.from('DeviceApproval').where('token', 'approved').first()

      const [siteId] = await insertSite(knex, {
        name: 'Some Site for Some cobas Device',
        shortName: 'SSF',
        externalId: 'SSF',
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
      ;[deviceId] = await knex('Device').insert({
        partnerId: partner.id,
        siteId,
        deviceTypeId: cobasDeviceType.id,
        deviceApprovalId: approvedDeviceApproval.id,
        moduleBayCapacity: 0,
        name: 'Some COBAS Device',
        shortName: 'COBAS',
        configurationData: '{}',
        putInService: now,
        lastSeenOn: now,
        createdOn: now,
        updatedOn: now,
      })
      const [deviceApiKeyId] = await knex('DeviceApiKey').insert({
        token: validApiKeyToken,
        siteId,
        revoked: false,
        createdOn: now,
        createdBy: userId,
        updatedOn: now,
        updatedBy: userId,
        partnerId: partner.id,
      })
      await knex('Device').where('id', deviceId).update({ deviceApiKeyId })
    })
  )
  after(() =>
    run(async knex => {
      await waitAsyncComplete()
      const {
        id: deviceApiKeyId,
        deviceId,
        siteId,
      } = await knex('DeviceApiKey as dak')
        .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
        .where('dak.token', validApiKeyToken)
        .first('dak.id', 'd.id as deviceId', 'd.siteId')
      await knex('DeviceApprovalLog').where('deviceId', deviceId).delete()
      await knex('DeviceLog').where('deviceApiKeyId', deviceApiKeyId).delete()

      await knex('DeviceApiRaw').where({ deviceApiKeyId }).delete()
      await knex('Device').where('id', deviceId).update({ deviceApiKeyId: null })
      await knex('DeviceApiKey').where('token', validApiKeyToken).delete()
      await knex('Device').where('id', deviceId).delete()
      await knex('Site').where('id', siteId).delete()
    })
  )

  it('should save the request in DeviceApiRaw and respond with the record ID', () =>
    runTestWithKnex(async knex => {
      const payload = {
        header:
          'H|\\^&|||Becton Dickinson|7 Loveton Circle^Sparks^MD^21152||410 316-4000||cobas||P|V1.00|20191019184200',
        body: `P|1\nO|1|0970038018^1||^^^MGIT_960_AST\nR|1|^^^AST_MGIT^439309967349^EMB^5.0^ug/ml|INST_ONGOING^123|||||P|||20190502115414|20190502135414|MGIT960^^^13^B/A02\nR|2|^^^AST_MGIT^439309967349^RIF^1.0^ug/ml|INST_ONGOING^12|||||P|||20190502115414|20190502135414|MGIT960^^^13^B/A03\nL|1|N`,
      }
      const response = await server
        .post(deviceApiRawPath)
        .set('Authorization', `Bearer ${validApiKeyToken}`)
        .set('Content-type', 'application/json')
        .send(payload)
      const deviceApiRawRecord = await knex('DeviceApiRaw').where({ id: response.body.deviceApiRawId }).first()
      assert.equal(response.statusCode, 200)
      expect(JSON.parse(deviceApiRawRecord.rawData).payload).to.deep.equal(payload)
      expect(response.body.deviceId).to.equal(deviceId)
      expect(response.body.deviceLogId).to.be.above(0)
    }))
})
