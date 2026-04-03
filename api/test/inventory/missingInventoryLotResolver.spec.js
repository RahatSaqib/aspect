const chai = require('chai')
const _ = require('lodash')
const addYears = require('date-fns/addYears')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')
const { knex } = require('../../src/db')
const { createMessageContext, waitForIdle, waitForAction } = require('../utils/mqUtils')
const { missingInventoryLotsResolver } = require('../../src/inventory/actions')
const { insertSite } = require('../../src/site/common/db')
const { randomToken } = require('../../src/deviceApi/apiKey')

const { assert } = chai

describe('Missing inventory lot resolver', () => {
  const consumableName = 'GeneXpert TB Cartridge'
  const assayName = 'GeneXpert MTB/Rif'
  const testLotNumber = '987654321'
  const expiryDate = new Date(addYears(new Date(), 1).setHours(0, 0, 0, 0))
  const now = new Date()
  const initialQuantityOnHand = 1

  const getScopedSites = async () => {
    const dataConstraints = await getConstraints({ name: 'admin' })
    const [site1] = await knex('Site as s')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      .leftOuterJoin('State as st', 'g.stateId', 'st.id')
      .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
      .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
      .modify(addConstraints, dataConstraints, {
        site: 's',
        geography: 'g',
      })
      .select('s.*')
      .limit(1)

    const [site1Id] = await insertSite(knex, {
      ..._.omit(site1, 'id'),
      name: 'TEST SITE 1',
      externalId: 'testSite1',
    })

    await insertSite(knex, {
      ..._.omit(site1, 'id'),
      name: 'TEST SITE 2',
      externalId: 'testSite2',
      parentWarehouseId: site1Id,
    })

    const newSites = await knex('Site').whereIn('externalId', ['testSite1', 'testSite2']).orderBy('id', 'desc').limit(2)
    return newSites
  }

  const generateTestData = async (site, warehouseSite) => {
    const { id: assayId } = await knex('Assay').where('name', assayName).first('id')
    const { id: consumableId } = await knex('Consumable').where('name', consumableName).first('id')

    await knex('InventoryItem').insert([
      {
        consumableId,
        siteId: site.id,
        lotNumber: testLotNumber,
        expiresOn: expiryDate,
        quantityOnHand: initialQuantityOnHand,
      },
      {
        consumableId,
        siteId: warehouseSite.id,
        lotNumber: testLotNumber,
        expiresOn: expiryDate,
        quantityOnHand: initialQuantityOnHand,
      },
    ])

    const [deviceId] = await knex('Device').insert({
      partnerId: site.partnerId,
      siteId: site.id,
      deviceTypeId: 7,
      deviceApprovalId: 3,
      name: site.name,
      shortName: site.shortName,
    })

    const { id: userId } = await knex('User').first('id')
    const [deviceApiKeyId] = await knex('DeviceApiKey').insert({
      token: randomToken(),
      revoked: 0,
      partnerId: site.partnerId,
      deviceId,
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
    })

    await knex('Device').where('id', deviceId).update({ deviceApiKeyId })

    const resultData = {
      assayId,
      partnerId: site.partnerId,
      siteId: site.id,
      deviceId,
      sampleId: 1,
      reportableSiteId: site.id,
      resultSourceId: 1,
      resultTypeId: 1,
      resultCategory1: 1,
      resultCategory2: 1,
      assayVersion: '5',
      startedOn: now,
      endedOn: now,
      consumableSerial: '382344479',
      consumableExpirationDate: expiryDate,
      consumableLot: testLotNumber,
      instrumentSerial: '800855',
      moduleName: 'G3',
      moduleSerial: '353281',
    }

    const [resultId1] = await knex('Result').insert({ ...resultData, externalId: 'TEST_RESULT_MISSING_LOT_1' })
    const [resultId2] = await knex('Result').insert({ ...resultData, externalId: 'TEST_RESULT_MISSING_LOT_2' })
    const [resultId3] = await knex('Result').insert({ ...resultData, externalId: 'TEST_RESULT_MISSING_LOT_3' })

    const baseDeviceLog = {
      deviceApiKeyId,
      source: '',
      createdOn: now,
      senderIp: '127.0.0.1',
      rawMessage: JSON.stringify({
        result: {
          consumable: [
            {
              serial: '382344479',
              lot: testLotNumber,
              expirationDate: expiryDate,
            },
          ],
        },
      }),
      deviceConfigurationUpdated: 1,
      deviceOperationId: null,
    }

    await knex('DeviceLog').insert([
      { ...baseDeviceLog, resultId: resultId1 },
      { ...baseDeviceLog, resultId: resultId2 },
      { ...baseDeviceLog, resultId: resultId3 },
    ])

    return [resultId1, resultId2, resultId3]
  }

  const deleteTestData = async () => {
    await knex('DeviceLog')
      .whereIn('deviceApiKeyId', await knex('Device').whereIn('siteId', sitesToRemove).pluck('deviceApiKeyId'))
      .delete()

    await knex('FactInventoryConsumptionRate').whereIn('siteId', sitesToRemove).delete()
    const inventoryItemsToRemove = await knex('InventoryItem').whereIn('siteId', sitesToRemove).pluck('id')
    const inventoryLogsToRemove = await knex('InventoryLog')
      .whereIn('inventoryItemId', inventoryItemsToRemove)
      .pluck('id')
    await knex('InventoryTransfer')
      .whereIn('outcomeInventoryLogId', inventoryLogsToRemove)
      .orWhereIn('incomeInventoryLogId', inventoryLogsToRemove)
      .orWhereIn('tempInventoryItemId', inventoryItemsToRemove)
      .delete()
    await knex('InventoryLog').whereIn('id', inventoryLogsToRemove).delete()
    await knex('InventoryItem').whereIn('id', inventoryItemsToRemove).delete()
    await knex('Result as r').whereIn('r.siteId', sitesToRemove).delete()
    await knex('Device').whereIn('siteId', sitesToRemove).update({ deviceApiKeyId: null })
    await knex('DeviceApiKey')
      .whereIn('deviceId', await knex('Device').whereIn('siteId', sitesToRemove).pluck('id'))
      .delete()
    await knex('Device as d').whereIn('d.siteId', sitesToRemove).delete()
    await knex('Site as s').where('id', sitesToRemove[0]).delete()
    await knex('Site as s').where('id', sitesToRemove[1]).delete()
  }

  const sitesToRemove = []
  before(async () => {
    await knex('Consumable').update({
      strategy: 'withExpirationDateStrategy',
    })
  })

  after(async () => {
    await knex('Consumable').update({
      strategy: 'withLotAndExpirationDateStrategy',
    })
  })

  beforeEach(async () => {
    const [site1, site2] = await getScopedSites()
    sitesToRemove.push(site1.id)
    sitesToRemove.push(site2.id)

    await generateTestData(site1, site2)
  })

  afterEach(async () => {
    await deleteTestData()
  })

  it('should transfer and consume inventory of missing lots', async () => {
    const messageContext = await createMessageContext()
    messageContext.bindActionCreators({ missingInventoryLotsResolver })

    const actionCreated = missingInventoryLotsResolver()
    const waitForCreated = waitForAction(actionCreated)

    // dispatch to MQ a messageId (generated in AlertMessage)
    messageContext.missingInventoryLotsResolver()

    await waitForCreated
    await waitForIdle(5000)

    const { missingInventoryLotsCount } = await knex('Result')
      .where('siteId', sitesToRemove[0])
      .whereNull('reconciliationDate')
      .count('* as missingInventoryLotsCount')
      .first()
    assert.equal(missingInventoryLotsCount, 1, 'The quantity of unreconciled consumptions should be 1')

    const { transfersCount } = await knex('InventoryTransfer as it')
      .leftJoin('InventoryLog as il', 'il.id', 'it.incomeInventoryLogId')
      .where('il.siteId', sitesToRemove[0])
      .count('* as transfersCount')
      .first()
    assert.equal(transfersCount, 1)

    const { id: consumableId } = await knex('Consumable').where('name', consumableName).first('id')
    const { total: totalSite1 } = await knex('InventoryItem')
      .andWhere('siteId', sitesToRemove[0])
      .andWhere('consumableId', consumableId)
      .andWhere('expiresOn', expiryDate)
      .select({
        total: knex.raw('IFNULL(SUM(quantityOnHand), 0)'),
      })
      .first()
    const { total: totalSite2 } = await knex('InventoryItem')
      .andWhere('siteId', sitesToRemove[1])
      .andWhere('consumableId', consumableId)
      .andWhere('expiresOn', expiryDate)
      .select({
        total: knex.raw('IFNULL(SUM(quantityOnHand), 0)'),
      })
      .first()
    assert.equal(totalSite1, 0)
    assert.equal(totalSite2, 0)
  })
})
