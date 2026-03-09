const chai = require('chai')
const chaiSubset = require('chai-subset')
const uuid = require('node-uuid')

const { expect } = chai.use(chaiSubset)
const { knex } = require('../../src/db')

const { deviceTypeToId, deviceApprovalToId } = require('../../src/shared/dictionary')

const devicePath = '/device'

const server = require('../utils/testUtils')
const { getPartner, getSite } = require('../utils/issueUtils')
const { insertSite } = require('../../src/site/common/db')
const { randomToken } = require('../../src/deviceApi/apiKey')

const delay = 5000

const deleteDevice = async deviceIds => {
  const deviceApiKeyIds = [
    ...(await knex('Device').whereIn('id', deviceIds).pluck('deviceApiKeyId')),
    ...(await knex('DeviceApiKey').whereIn('deviceId', deviceIds).pluck('id')),
  ].filter(Boolean)
  const resultIds = await knex('Result').whereIn('deviceId', deviceIds).pluck('id')

  if (resultIds.length > 0) {
    await knex('InventoryLog').delete().whereIn('resultId', resultIds)
  }

  await knex('Result').delete().whereIn('deviceId', deviceIds)

  if (deviceApiKeyIds.length > 0) {
    await knex('DeviceLog').whereIn('deviceApiKeyId', deviceApiKeyIds).delete()
  }

  await knex('Instrument').whereIn('deviceId', deviceIds).delete()

  await knex('FactDeviceModulesCount').delete().whereIn('deviceId', deviceIds)

  await knex('Device').whereIn('id', deviceIds).update({ deviceApiKeyId: null })
  await knex('DeviceApiKey').whereIn('deviceId', deviceIds).update({ deviceId: null })

  if (deviceApiKeyIds.length > 0) {
    await knex('DeviceApiKey').whereIn('id', deviceApiKeyIds).delete()
  }

  await knex('Device').delete().whereIn('id', deviceIds)
}

const deleteResults = async resultIds => {
  const resultIdsToBeDeleted = [...new Set(resultIds)]

  await knex('InventoryLog').delete().whereIn('resultId', resultIdsToBeDeleted)
  await knex('Result').delete().whereIn('id', resultIdsToBeDeleted)
}

const insertDevice = async (name, siteId, partnerId, instrumentSerial = null) => {
  const [deviceId] = await knex('Device').insert({
    partnerId,
    siteId,
    deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
    deviceApprovalId: await deviceApprovalToId('approved'),
    name,
    shortName: name,
    lastSeenOn: now,
  })
  if (instrumentSerial) {
    await knex('Instrument').insert({
      deviceId,
      serial: instrumentSerial,
      macAddress: null,
      createdOn: now,
      createdBy: 1,
      updatedOn: now,
      updatedBy: 1,
    })
  }
  return deviceId
}

const insertDeviceApiKey = async (token, deviceId, siteId, geographyId, partnerId) => {
  const [deviceApiId] = await knex('DeviceApiKey').insert({
    token,
    revoked: 0,
    partnerId,
    geographyId,
    siteId,
    createdOn: now,
    createdBy: 1,
    updatedOn: now,
    updatedBy: 1,
    deviceId,
  })

  return deviceApiId
}

const separateData = data => {
  const quantityZero = []
  const quantityOne = []
  data.forEach(item => {
    if (item.resultCount === 0) {
      quantityZero.push(item)
    } else if (item.resultCount === 1) {
      quantityOne.push(item)
    }
  })

  return { quantityZero, quantityOne }
}

const now = new Date()

const USER_LU_NAME = 'myanmar_lab1'

const partnerName = 'MoHS'
const countryAbbreviation = 'MM'

describe('Device result calculation test', function () {
  this.timeout(12000)
  let partnerId
  let geographyId
  let token
  let token2
  let token3
  let siteId
  let siteId2
  let deviceId
  let deviceId2
  let deviceId3
  const resultIds = []
  let resultPayload = {}

  before(async () => {
    const partner = await getPartner(knex, partnerName)
    partnerId = partner.id

    const { id: labUserId } = await knex('User').where({ name: USER_LU_NAME }).first()

    const {
      s: { id },
    } = await getSite(knex, {
      partnerId,
      countryAbbreviation,
      requireInventory: false,
      userId: labUserId,
    })

    geographyId = id
  })

  after(async () => {
    await deleteResults(resultIds)
    await deleteDevice([deviceId, deviceId2, deviceId3])

    await knex('DeviceApiKey').delete().whereIn('siteId', [siteId, siteId2])

    await knex('InventoryItem').delete().whereIn('siteId', [siteId, siteId2])

    await knex('Sample').delete().whereIn('originSiteId', [siteId, siteId2])

    await knex('Site').delete().whereIn('id', [siteId, siteId2])
  })

  beforeEach(async () => {
    resultPayload = {
      name: 'Crenshaw Clinic & GeneXpert',
      serial: 'ZDsTxRPfPErrIJFFRKCbmxMQ',
      status: null,
      type: {
        id: 'CepheidGeneXpert',
      },
      result: {
        id: '13d9fa2a-471b-11ee-a7da-8def055759e2',
        checkpoint: null,
        startedOn: '2023-08-31T23:25:17Z',
        endedOn: null,
        data: {
          deviceApiKey: null,
          hostId: 'ETWPIkdJ',
          deviceName: 'Crenshaw Clinic & GeneXpert',
          deviceShortName: 'Crenshaw GeneXpert',
          country: 'US',
          computerId: 'ZDsTxRPfPErrIJFFRKCbmxMQ',
          deviceSerial: 'ZDsTxRPfPErrIJFFRKCbmxMQ',
          assay: 'XPERT MTB-XDR',
          testTypeId: 4,
          assayVersion: '4',
          testStartedOn: '2023-08-31T23:25:17Z',
          testEndedOn: null,
          cartridgeExpirationDate: '2090-12-25T02:51:00',
          cartridgeSerial: '13da0ed4-471b-11ee-a7da-8def044759e9',
          moduleName: 'G3',
          moduleSerial: '353281',
          instrumentSerial: '800855',
          sampleId: 'SOME SAMPLE 30 AUG-77201',
          user: 'cynthia calizo',
          messageSentOn: '2023-08-30T10:53:31Z',
          reagentLotId: '52283',
          softwareVersion: '4.3',
          resultText: '',
          result1Text: '',
          result2Text: '',
          result3Text: null,
          notes: '',
          errorCode: null,
          errorNotes: null,
          gxConnectVersion: '1.11.1.10',
          externalId: '13da0f10-471b-11ee-a7da-8def044759e9',
          eTBExamId: null,
          probes: {},
        },
        assay: {
          id: 'GxMtbXdr',
          version: '1',
        },
        sample: {
          id: 'SOME SAMPLE 30 AUG-77201',
        },
        category: null,
        consumable: [
          {
            serial: '13da1a8c-1b-11ee-a8da-8def044751e4',
            lot: '52283',
            expirationDate: '2090-10-29T00:00:00Z',
          },
        ],
        instrument: {
          serial: '800855',
          module: {
            name: 'G3',
            serial: '353281',
          },
        },
        patient: {
          id: 'Steven Gerrad',
          name: 'Steven',
          surname: 'Gerrad',
        },
        sender: {
          version: '4.3',
          operator: 'cynthia calizo',
        },
        error: null,
      },
    }

    // create new site for same partner and same geography
    ;[siteId] = await insertSite(knex, {
      name: 'Test Site',
      shortName: 'Test Site',
      externalId: `Test Site ${new Date().getTime()}`,
      partnerId,
      geographyId,
    })
    ;[siteId2] = await insertSite(knex, {
      name: 'Test Site 2',
      shortName: 'Test Site 2',
      externalId: `Test Site 2 ${new Date().getTime()}`,
      partnerId,
      geographyId,
    })

    const instrumentSerial = resultPayload.result.instrument.serial
    deviceId = await insertDevice('Test Device', siteId, partnerId, instrumentSerial)
    deviceId2 = await insertDevice('Test Device 2', siteId, partnerId, instrumentSerial)
    deviceId3 = await insertDevice('Test Device 3', siteId2, partnerId, instrumentSerial)

    token = randomToken()
    token2 = randomToken()
    token3 = randomToken()

    await insertDeviceApiKey(token, deviceId, siteId, geographyId, partnerId)
    await insertDeviceApiKey(token2, deviceId2, siteId, geographyId, partnerId)
    await insertDeviceApiKey(token3, deviceId3, siteId2, geographyId, partnerId)
  })

  afterEach(async () => {
    await knex('FactResultsDeviceByTimeFrame').delete().whereIn('deviceId', [deviceId, deviceId2, deviceId3])

    await deleteDevice([deviceId, deviceId2, deviceId3])

    await deleteResults(resultIds)
  })

  it('should ensure record is created appropriately in fact table', async () => {
    const postResult = await server.post(devicePath).set('Authorization', token).send(resultPayload)
    resultIds.push(postResult.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))

    const factResult = await knex('FactResultsDeviceByTimeFrame').where({ deviceId }).orderBy('calculatedOn', 'desc')

    expect(postResult.status).to.equal(200)

    const { quantityZero, quantityOne } = separateData(factResult)

    expect(quantityZero.length).to.eq(0)
    expect(quantityOne.length).to.eq(2)
  })

  it('should ensure record is created appropriately in fact table and timezone is considered', async () => {
    const postResult = await server.post(devicePath).set('Authorization', token).send(resultPayload)
    resultIds.push(postResult.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))

    const factResult = await knex('FactResultsDeviceByTimeFrame').where({ deviceId }).orderBy('calculatedOn', 'desc')

    expect(postResult.status).to.equal(200)
    expect(factResult.length).to.equal(2)

    factResult.forEach(item => {
      expect(item.startedOn.getMonth()).to.eq(8) // month starts from 0 index
    })
  })

  it('should ensure resultCount decreases in the fact table when same result resultCategory1 and resultCategory1 are changed', async () => {
    // post a result (not yet concluded)
    const postResult = await server.post(devicePath).set('Authorization', token).send(resultPayload)
    resultIds.push(postResult.body.aspectResultId)

    // post another result (not yet concluded)
    const newSampleId = 'new result sampleId'
    resultPayload.result.sample.id = newSampleId
    resultPayload.result.consumable[0].serial = uuid()
    resultPayload.result.data.sampleId = newSampleId

    const postResult2 = await server.post(devicePath).set('Authorization', token).send(resultPayload)
    resultIds.push(postResult2.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))

    // post the concluded test for the second result
    const resultEndDate = '2023-09-02T23:58:31Z'
    resultPayload.result.endedOn = resultEndDate
    resultPayload.result.data.testStartedOn = resultEndDate
    resultPayload.result.data.resultText = 'MTB Not Detected|Rif Resistance Not Detected'
    resultPayload.result.data.result1Text = 'MTB Not Detected'
    resultPayload.result.data.result2Text = 'Rif Resistance Not Detected'

    const postResult3 = await server.post(devicePath).set('Authorization', token).send(resultPayload)

    resultIds.push(postResult3.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))
    const factResult = await knex('FactResultsDeviceByTimeFrame').where({ deviceId }).orderBy('calculatedOn', 'desc')
    expect(postResult.status).to.equal(200)
    expect(postResult2.status).to.equal(200)
    expect(postResult3.status).to.equal(200)
    expect(factResult.length).to.be.gt(2)

    const { quantityZero, quantityOne } = separateData(factResult)

    expect(quantityZero.length).to.eq(0)
    expect(quantityOne.length).to.eq(4)
  })

  it('should ensure resultCount decreases in the fact table when same result is uploaded with varying endedOn', async () => {
    const resultEndDate = '2023-09-02T23:58:31Z'
    resultPayload.result.endedOn = resultEndDate
    resultPayload.result.data.testStartedOn = resultEndDate
    resultPayload.result.data.resultText = 'MTB Not Detected|Rif Resistance Not Detected'
    resultPayload.result.data.result1Text = 'MTB Not Detected'
    resultPayload.result.data.result2Text = 'Rif Resistance Not Detected'
    const postResult = await server.post(devicePath).set('Authorization', token).send(resultPayload)

    resultIds.push(postResult.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))

    resultPayload.result.endedOn = '2023-10-01T10:25:17Z'
    resultPayload.result.testEndedOn = '2023-10-01T10:25:17Z'

    const postResult2 = await server.post(devicePath).set('Authorization', token).send(resultPayload)

    resultIds.push(postResult2.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))
    const factResult = await knex('FactResultsDeviceByTimeFrame').where({ deviceId }).orderBy('calculatedOn', 'desc')

    const { quantityZero, quantityOne } = separateData(factResult)

    expect(postResult.status).to.equal(200)
    expect(postResult2.status).to.equal(200)

    expect(quantityZero.length).to.eq(0)
    expect(quantityOne.length).to.eq(2)

    factResult.forEach(item => {
      expect(item.startedOn.getMonth()).to.eq(9) // month starts from 0 index
    })
  })

  it('should ensure resultCount decreases in the fact table when same result is uploaded with varying assays', async () => {
    const postResult = await server.post(devicePath).set('Authorization', token).send(resultPayload)
    resultIds.push(postResult.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))

    resultPayload.result.data.assay = 'MTB-RIF_ULTRA'
    resultPayload.assay = {
      id: 'GxMtbRifUltra',
      version: '2',
    }

    const postResult2 = await server.post(devicePath).set('Authorization', token).send(resultPayload)

    resultIds.push(postResult2.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))
    const factResult = await knex('FactResultsDeviceByTimeFrame').where({ deviceId }).orderBy('calculatedOn', 'desc')

    expect(postResult.status).to.equal(200)
    expect(postResult2.status).to.equal(200)
    expect(factResult.length).to.eq(4)

    const { quantityZero, quantityOne } = separateData(factResult)

    expect(quantityZero.length).to.eq(0)
    expect(quantityOne.length).to.eq(4)
  })

  it('should ensure no new record is created in the fact table when same result is uploaded from different sites', async () => {
    const postResult = await server.post(devicePath).set('Authorization', token).send(resultPayload)
    resultIds.push(postResult.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))

    const postResult2 = await server.post(devicePath).set('Authorization', token3).send(resultPayload)

    resultIds.push(postResult2.body.aspectResultId)

    await new Promise(resolve => setTimeout(resolve, delay))
    const factResult = await knex('FactResultsDeviceByTimeFrame')
      .whereIn('deviceId', [deviceId, deviceId3])
      .orderBy('calculatedOn', 'desc')

    expect(postResult.status).to.equal(200)
    expect(postResult2.status).to.equal(200)

    const { quantityZero, quantityOne } = separateData(factResult)

    expect(quantityZero.length).to.eq(0)
    expect(quantityOne.length).to.eq(2)
  })
})
