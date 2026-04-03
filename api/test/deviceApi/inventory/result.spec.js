const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const { subDays, addDays, startOfDay } = require('date-fns')
const { knex } = require('../../../src/db')
const { parseDateOrDefault, getLocalDateInUtc, startOfDayUtc } = require('../../../src/shared/date')
const { createTestContext, getResult } = require('../utils')

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}
const server = require('../../utils/testUtils')
const { selectAssayConsumables } = require('../../../src/consumable/assayConsumableService')

const { assert } = chai.use(chaiSubset)

const devicePath = '/device'
describe('admin result updates', () => {
  const context = createTestContext(knex, server, {
    user: 'admin',
    type: 'CepheidGeneXpert',
    partner: 'Partner One',
    baseConfig,
  })

  beforeEach(async () => {
    await context.createDeviceWithResult({ instrumentSerial: '02384702' })
  })
  afterEach(context.afterEach)
  async function getInventoryItemsAtSite(knex, siteId) {
    return _.map(
      await knex('InventoryItem')
        .where({ siteId })
        .select('id', 'consumableId', 'lotNumber', 'expiresOn', 'quantityOnHand')
        .orderBy('id'),
      inventoryItem =>
        _.assign({}, inventoryItem, {
          expiresOn: parseDateOrDefault(inventoryItem.expiresOn),
        })
    )
  }

  describe('inventory management With Lot and Expiration date', () => {
    before(async () =>
      knex('Consumable').update({
        strategy: 'withLotAndExpirationDateStrategy',
      })
    )

    after(async () =>
      knex('Consumable').update({
        strategy: 'withExpirationDateStrategy',
      })
    )

    it('should deduct inventory levels from the site', async () => {
      const { deviceId, deviceAuth, now } = context
      const results = [
        {
          assayExternalId: 'DaktariHivVL',
          cartridgeName: 'Daktari HIV-VL Cartridge',
          deviceId,
        },
      ]

      await Promise.all(
        _.map(results, async resultDetails => {
          const { siteId } = await knex('Device').where({ id: resultDetails.deviceId }).first('siteId')
          const cartridgeId = (await knex('Consumable').where({ name: resultDetails.cartridgeName }).first('id')).id

          const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)
          const firstCartridgeConsumable = _.find(
            inventoryItemsBefore,
            item => item.consumableId === cartridgeId && item.expiresOn != null
          )
          if (firstCartridgeConsumable) {
            const assayConsumables = await knex('ConsumableAssay as ca')
              .join('Assay as a', 'ca.assayId', 'a.id')
              .where('a.externalId', resultDetails.assayExternalId)
              .select('ca.consumableId', 'ca.assayId', 'ca.quantity')

            await server
              .post(devicePath)
              .set('Authorization', deviceAuth)
              .send({
                type: {
                  id: 'CepheidGeneXpert',
                },
                result: {
                  startedOn: now,
                  data: { assay: 'Xpert MTB-RIF', a: 'b' },
                  assay: { id: resultDetails.assayExternalId },
                  consumable: {
                    lot: firstCartridgeConsumable.lotNumber,
                    expirationDate: firstCartridgeConsumable.expiresOn.toJSON(),
                  },
                },
              })
              .then(res => {
                assert.equal(res.status, 200)
              })

            const inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)

            assayConsumables.forEach(assayConsumable => {
              const inventoryItemBefore = _.find(inventoryItemsBefore, {
                consumableId: assayConsumable.consumableId,
              })
              const inventoryItemAfter = _.find(inventoryItemsAfter, {
                consumableId: assayConsumable.consumableId,
              })

              if (inventoryItemBefore) {
                assert.equal(
                  inventoryItemAfter.quantityOnHand,

                  inventoryItemBefore.quantityOnHand - assayConsumable.quantity
                )
              }
            })
          }
        })
      )
    })

    it('should try to deduct the correct inventory item based on expiration date and lot number', async () => {
      const { deviceId, deviceAuth, now, user } = context
      const past = new Date(+now - 36000)
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const { id: adminId } = await knex('User').where({ name: user }).first('id')
      const assayExternalId = 'GxMtbRif'
      const gxMtbRifCartridgeId = (
        await knex('Consumable as c').where('c.externalId', 'GxMtbRifCartridge').first('c.id')
      ).id

      let resultDetails = {
        lotNumber: 'ABC123',
        expirationDate: '2045-01-30 00:00:00Z',
      }

      const [lotNumberAndExpirationDateMatch] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: resultDetails.lotNumber,
        expiresOn: new Date(resultDetails.expirationDate),
        quantityOnHand: 20,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })

      const inventoryConsumedByTest = (
        await knex('ConsumableAssay as ca')
          .join('Assay as a', 'ca.assayId', 'a.id')
          .where('a.externalId', assayExternalId)
          .andWhere('ca.consumableId', gxMtbRifCartridgeId)
          .first('ca.quantity')
      ).quantity

      let cartridgeAtSiteBefore = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem =>
          inventoryItem.lotNumber === resultDetails.lotNumber &&
          inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: assayExternalId },
            sample: {
              id: Math.random().toString(36).slice(2),
            },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      let cartridgeAtSiteAfter = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem =>
          inventoryItem.lotNumber === resultDetails.lotNumber &&
          inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      assert.equal(
        cartridgeAtSiteAfter.quantityOnHand,

        cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest
      )

      resultDetails = {
        lotNumber: 'XYZ321',
        expirationDate: '2035-01-30 00:00:00Z',
      }
      const randomExpiryDate = new Date('2017-03-05 00:00:00Z')
      const [onlyLotNumberMatches] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: resultDetails.lotNumber,
        expiresOn: randomExpiryDate,
        quantityOnHand: 30,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })
      cartridgeAtSiteBefore = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem =>
          inventoryItem.lotNumber === resultDetails.lotNumber &&
          inventoryItem.expiresOn.toISOString() === randomExpiryDate.toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: assayExternalId },
            sample: {
              id: Math.random().toString(36).slice(2),
            },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: randomExpiryDate,
            },
          },
        })
        .expect(200)

      cartridgeAtSiteAfter = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem =>
          inventoryItem.lotNumber === resultDetails.lotNumber &&
          inventoryItem.expiresOn.toISOString() === randomExpiryDate.toISOString()
      )

      assert.equal(cartridgeAtSiteAfter.quantityOnHand, cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest)

      resultDetails = {
        lotNumber: 'ABC123',
        expirationDate: '2019-11-16 00:00:00Z',
      }
      const randomLotNumber = 'RANDOM-LOT'
      const [onlyExpirationDateMatches] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: randomLotNumber,
        expiresOn: new Date(resultDetails.expirationDate),
        quantityOnHand: 45,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })
      cartridgeAtSiteBefore = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem =>
          inventoryItem.lotNumber === randomLotNumber &&
          inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: assayExternalId },
            sample: {
              id: Math.random().toString(36).slice(2),
            },
            instrument: { serial: '02384702' },
            consumable: {
              lot: randomLotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      const inventoryAfter = await getInventoryItemsAtSite(knex, siteId)
      cartridgeAtSiteAfter = _.find(
        inventoryAfter,
        inventoryItem =>
          inventoryItem.lotNumber === randomLotNumber &&
          inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      await knex('InventoryLog')
        .whereIn('inventoryItemId', [lotNumberAndExpirationDateMatch, onlyLotNumberMatches, onlyExpirationDateMatches])
        .del()
      await knex('InventoryItem')
        .whereIn('id', [lotNumberAndExpirationDateMatch, onlyLotNumberMatches, onlyExpirationDateMatches])
        .del()

      assert.equal(
        cartridgeAtSiteAfter.quantityOnHand,

        cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest
      )
    })
    it('should try to deduct the correct inventory item based on expiration date over lot number', async () => {
      const { deviceId, deviceAuth, now, user, partnerId } = context
      const past = new Date(+now - 36000)
      knex('Partner')
        .update({
          inventoryStrategy: 'withExpirationDateStrategy',
        })
        .where('partnerId', partnerId)
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const { id: adminId } = await knex('User').where({ name: user }).first('id')
      const assayExternalId = 'GxMtbRif'
      const gxMtbRifCartridgeId = (
        await knex('Consumable as c').where('c.externalId', 'GxMtbRifCartridge').first('c.id')
      ).id

      const resultDetails = {
        lotNumber: 'QWE987',
        expirationDate: '2017-12-16 00:00:00Z',
      }
      const randomExpiryDate = new Date('2017-03-05 00:00:00Z')
      const [onlyLotNumberMatches] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: resultDetails.lotNumber,
        expiresOn: randomExpiryDate,
        quantityOnHand: 30,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })
      const randomLotNumber = 'SOME-LOT-NUMBER'
      const [onlyExpirationDateMatches] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: randomLotNumber,
        expiresOn: new Date(resultDetails.expirationDate),
        quantityOnHand: 45,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })
      const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)
      const matchingLotNumberCartridgeAtSiteBefore = _.find(
        inventoryItemsBefore,
        inventoryItem =>
          inventoryItem.lotNumber === resultDetails.lotNumber &&
          inventoryItem.expiresOn.toISOString() === new Date(randomExpiryDate).toISOString()
      )
      const matchingExpirationDateCartridgeAtSiteBefore = _.find(
        inventoryItemsBefore,
        inventoryItem =>
          inventoryItem.lotNumber === randomLotNumber &&
          inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: assayExternalId },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      const inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)

      await knex('InventoryLog').whereIn('inventoryItemId', [onlyLotNumberMatches, onlyExpirationDateMatches]).del()

      await knex('InventoryItem').whereIn('id', [onlyLotNumberMatches, onlyExpirationDateMatches]).del()

      const matchingLotNumberCartridgeAtSiteAfter = _.find(
        inventoryItemsAfter,
        inventoryItem =>
          inventoryItem.lotNumber === resultDetails.lotNumber &&
          inventoryItem.expiresOn.toISOString() === randomExpiryDate.toISOString()
      )

      const matchingExpirationDateCartridgeAtSiteAfter = _.find(
        inventoryItemsAfter,
        inventoryItem =>
          inventoryItem.lotNumber === randomLotNumber &&
          inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      assert.equal(
        matchingLotNumberCartridgeAtSiteAfter.quantityOnHand,
        matchingLotNumberCartridgeAtSiteBefore.quantityOnHand
      )

      assert.equal(
        matchingExpirationDateCartridgeAtSiteAfter.quantityOnHand,
        matchingExpirationDateCartridgeAtSiteBefore.quantityOnHand
      )
    })

    it('should deduct inventory item with null lot number and expiresOn', async () => {
      const { deviceId, deviceAuth, now, user } = context
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const { id: adminId } = await knex('User').where({ name: user }).first('id')

      const past = subDays(now, 1)
      const future = addDays(startOfDayUtc(now), 7)

      const assayExternalId = 'GxMtbRif'
      const { id: gxMtbRifCartridgeId } = await knex('Consumable as c')
        .where('c.externalId', 'GxMtbRifCartridge')
        .first('c.id')

      // Remove inventory item if it already exists
      await knex('InventoryItem').where({ consumableId: gxMtbRifCartridgeId, siteId }).del()

      const expiresOn = future.toISOString().split('T')[0]
      const [inventoryItemId] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: 'HIV582',
        expiresOn,
        quantityOnHand: 50,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })

      const { quantity: inventoryConsumedByTest } = await knex('ConsumableAssay as ca')
        .join('Assay as a', 'ca.assayId', 'a.id')
        .where('a.externalId', assayExternalId)
        .andWhere('ca.consumableId', gxMtbRifCartridgeId)
        .first('ca.quantity')

      const resultDetails = {
        lotNumber: 'HIV582',
        expirationDate: expiresOn,
      }

      const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)
      const inventoryItemBefore = _.find(inventoryItemsBefore, {
        id: inventoryItemId,
      })
      assert.isOk(inventoryItemBefore)
      assert.isOk(inventoryItemBefore.lotNumber)
      assert.equal(inventoryItemBefore.expiresOn.toISOString(), future.toISOString())
      assert.equal(inventoryItemBefore.quantityOnHand, 50)

      const inventoryLogsBefore = await knex('InventoryLog').where({ inventoryItemId }).select('id')
      assert.equal(inventoryLogsBefore.length, 0)

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', b: 'c' },
            assay: { id: assayExternalId },
            sample: { id: 'New Test Deduct From Null Item' },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      const inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)

      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))
      const inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })
      assert.isOk(inventoryItemAfter.lotNumber)
      assert.equal(inventoryItemAfter.expiresOn.toISOString(), future.toISOString())
      assert.equal(inventoryItemAfter.quantityOnHand, inventoryItemBefore.quantityOnHand - inventoryConsumedByTest)

      const inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).select()
      assert.equal(inventoryLogsAfter.length, 1)

      const inventoryLog = inventoryLogsAfter[0]
      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      const result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, 'New Test Deduct From Null Item')
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )
    })

    it.skip('should update lot number if null and exact match of expiresOn', async () => {
      const { deviceId, deviceAuth, now, user, partnerId } = context
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const { id: adminId } = await knex('User').where({ name: user }).first('id')

      const past = subDays(now, 3)
      const future = addDays(now, 7)
      const futureExpiresOn = getLocalDateInUtc(startOfDay(future))

      const assayExternalId = 'GxMtbRif'
      const { assayId } = await knex('Assay').where('externalId', assayExternalId).first('id as assayId')
      const { id: gxMtbRifCartridgeId } = await knex('Consumable as c')
        .where('c.externalId', 'GxMtbRifCartridge')
        .first('c.id')

      await knex('InventoryItem').where({ consumableId: gxMtbRifCartridgeId, siteId }).del()

      const [inventoryItemId] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: null,
        expiresOn: futureExpiresOn,
        quantityOnHand: 50,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })
      const [{ quantity: inventoryConsumedByTest }] = await selectAssayConsumables(
        knex,
        { partner: { id: partnerId } },
        assayId
      )

      const resultDetails = {
        lotNumber: 'HIV58119',
        expirationDate: futureExpiresOn.toISOString(),
      }

      const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)
      const inventoryItemBefore = _.find(inventoryItemsBefore, {
        id: inventoryItemId,
      })
      assert.isOk(inventoryItemBefore)
      assert.isNotOk(inventoryItemBefore.lotNumber)
      assert.equal(inventoryItemBefore.expiresOn.toISOString(), futureExpiresOn.toISOString())
      assert.equal(inventoryItemBefore.quantityOnHand, 50)

      const inventoryLogsBefore = await knex('InventoryLog').where({ inventoryItemId }).select('id')
      assert.equal(inventoryLogsBefore.length, 0)

      let res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', b: 'c' },
            assay: { id: assayExternalId },
            sample: { id: 'New Test Deduct Update Lot Number' },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
      assert.equal(res.status, 200)
      let inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))
      let inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })
      assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
      assert.equal(inventoryItemAfter.expiresOn.toISOString(), futureExpiresOn.toISOString())
      assert.equal(inventoryItemAfter.quantityOnHand, inventoryItemBefore.quantityOnHand - inventoryConsumedByTest)

      let inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).select()
      assert.equal(inventoryLogsAfter.length, 1)

      let [inventoryLog] = inventoryLogsAfter
      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      let result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, 'New Test Deduct Update Lot Number')
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )

      res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: new Date().toISOString(),
            data: { assay: 'Xpert MTB-RIF', b: 'd' },
            assay: { id: assayExternalId },
            sample: { id: 'New Test Deduct Update Lot Number 2' },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
      assert.equal(res.status, 200)

      inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))
      inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })

      assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)

      assert.equal(inventoryItemAfter.expiresOn.toISOString(), futureExpiresOn.toISOString())

      assert.equal(inventoryItemAfter.quantityOnHand, inventoryItemBefore.quantityOnHand - inventoryConsumedByTest * 2)

      inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).orderBy('id', 'desc').select()
      assert.equal(inventoryLogsAfter.length, 2)
      ;[inventoryLog] = inventoryLogsAfter
      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, 'New Test Deduct Update Lot Number 2')
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )
    })

    it('should update quantityOnHand only if the result does not exists on InventoryLog', async () => {
      const { deviceId, deviceAuth, now, user } = context
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const { id: adminId } = await knex('User').where({ name: user }).first('id')

      const past = subDays(now, 1)
      const future = addDays(now, 7)
      const futureExpiresOn = startOfDay(future)

      const assayExternalId = 'GxMtbRif'
      const { id: gxMtbRifCartridgeId } = await knex('Consumable as c')
        .where('c.externalId', 'GxMtbRifCartridge')
        .first('c.id')

      await knex('InventoryItem').where({ consumableId: gxMtbRifCartridgeId, siteId }).del()

      const [inventoryItemId] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: 'HIV58210',
        expiresOn: futureExpiresOn,
        quantityOnHand: 50,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })

      const { quantity: inventoryConsumedByTest } = await knex('ConsumableAssay as ca')
        .join('Assay as a', 'ca.assayId', 'a.id')
        .where('a.externalId', assayExternalId)
        .andWhere('ca.consumableId', gxMtbRifCartridgeId)
        .first('ca.quantity')

      const resultDetails = {
        lotNumber: 'HIV58210',
        expirationDate: futureExpiresOn.toISOString(),
      }

      const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)
      const inventoryItemBefore = _.find(inventoryItemsBefore, {
        id: inventoryItemId,
      })
      assert.isOk(inventoryItemBefore)
      assert.equal(inventoryItemBefore.lotNumber, resultDetails.lotNumber)
      assert.equal(inventoryItemBefore.expiresOn.toISOString(), futureExpiresOn.toISOString())
      assert.equal(inventoryItemBefore.quantityOnHand, 50)

      const inventoryLogsBefore = await knex('InventoryLog').where({ inventoryItemId }).select('id')
      assert.equal(inventoryLogsBefore.length, 0)
      const fakeResultId = 'fake-result-id'
      const fakeSampleId = 'fake-sample-id'

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            id: fakeResultId,
            startedOn: past,
            data: { assay: 'Xpert MTB-RIF', b: 'c' },
            assay: { id: assayExternalId },
            sample: { id: fakeSampleId },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      let inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)

      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))

      let inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })
      assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
      assert.equal(inventoryItemAfter.expiresOn.toISOString(), futureExpiresOn.toISOString())
      assert.equal(inventoryItemBefore.id, inventoryItemAfter.id, 'Inventory Item used is the one created by the test')
      assert.equal(
        inventoryItemAfter.quantityOnHand,
        inventoryItemBefore.quantityOnHand - inventoryConsumedByTest,
        'Quantity on Hand must be updated after first result'
      )

      let inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).select()
      assert.equal(inventoryLogsAfter.length, 1)

      let [inventoryLog] = inventoryLogsAfter
      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      let result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, fakeSampleId)
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )

      // Simulate external quantity on hand change
      const newQuantityOnHand = 30

      await knex('InventoryItem')
        .where({ id: inventoryItemId })
        .update({ updatedOn: now, quantityOnHand: newQuantityOnHand })

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            id: fakeResultId,
            startedOn: past,
            data: { assay: 'Xpert MTB-RIF', b: 'd' },
            assay: { id: assayExternalId },
            sample: { id: fakeSampleId },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)
      inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))
      inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })

      assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)

      assert.equal(inventoryItemAfter.expiresOn.toISOString(), futureExpiresOn.toISOString())

      assert.equal(
        inventoryItemAfter.quantityOnHand,
        newQuantityOnHand,
        'Quantity on Hand must not be updated after second result'
      )

      inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).orderBy('id', 'desc').select()

      assert.equal(inventoryLogsAfter.length, 1)
      ;[inventoryLog] = inventoryLogsAfter
      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, fakeSampleId)
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            id: fakeResultId,
            startedOn: past,
            data: { b: 'e' },
            assay: { id: assayExternalId },
            sample: { id: fakeSampleId },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))
      inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })
      assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
      assert.isOk(inventoryItemAfter.expiresOn)
      assert.equal(inventoryItemAfter.quantityOnHand, newQuantityOnHand)

      inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).orderBy('id', 'desc').select()
      assert.equal(inventoryLogsAfter.length, 1)
      ;[inventoryLog] = inventoryLogsAfter
      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, fakeSampleId)
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )
    })
    it('should not log inventory consumption when no inventory item exists for site', async () => {
      const { deviceId, deviceAuth, now } = context
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const assayExternalId = 'GxMtbRif'
      const gxMtbRifCartridgeId = (
        await knex('Consumable as c').where('c.externalId', 'GxMtbRifCartridge').first('c.id')
      ).id
      // Remove inventory item if it already exists
      await knex('InventoryItem').where({ consumableId: gxMtbRifCartridgeId, siteId }).del()
      const resultDetails = {
        lotNumber: 'HIV533',
        expirationDate: getLocalDateInUtc(
          new Date(new Date().getTime() + _.random(0, 1000 * 60 * 60 * 24 * 365)).setHours(0, 0, 0, 0)
        ),
      }
      const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)

      assert.isUndefined(_.find(inventoryItemsBefore, { lotNumber: resultDetails.lotNumber }))

      const res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { a: 'b' },
            assay: { id: assayExternalId },
            sample: { id: 'New Test Deduct Unknown Item' },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      const resultId = res.body.aspectResultId
      const inventoryLogsAfter = await knex('InventoryLog').where('inventoryItemId', resultId).select()
      assert.equal(inventoryLogsAfter.length, 0, 'InventoryLog must not exist for the unreconciled record')
    })
  })

  describe('inventory management with Expiration date strategy', () => {
    before(async () => knex('Partner').update({ inventoryStrategy: 'withExpirationDateStrategy' }))
    after(async () =>
      knex('Partner').update({
        inventoryStrategy: 'withLotAndExpirationDateStrategy',
      })
    )

    it('should deduct inventory levels from the site', async () => {
      const { deviceId, deviceAuth, now } = context
      const results = [
        {
          assayExternalId: 'DaktariHivVL',
          cartridgeName: 'Daktari HIV-VL Cartridge',
          deviceId,
        },
      ]

      await Promise.all(
        _.map(results, async resultDetails => {
          const { siteId } = await knex('Device').where({ id: resultDetails.deviceId }).first('siteId')
          const cartridgeId = (await knex('Consumable').where({ name: resultDetails.cartridgeName }).first('id')).id

          const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)
          const firstCartridgeConsumable = _.find(
            inventoryItemsBefore,
            item => item.consumableId === cartridgeId && item.expiresOn != null
          )
          if (firstCartridgeConsumable) {
            const assayConsumables = await knex('ConsumableAssay as ca')
              .join('Assay as a', 'ca.assayId', 'a.id')
              .where('a.externalId', resultDetails.assayExternalId)
              .select('ca.consumableId', 'ca.assayId', 'ca.quantity')

            await server
              .post(devicePath)
              .set('Authorization', deviceAuth)
              .send({
                type: {
                  id: 'CepheidGeneXpert',
                },
                result: {
                  startedOn: now,
                  data: { a: 'b' },
                  assay: { id: resultDetails.assayExternalId },
                  consumable: {
                    lot: firstCartridgeConsumable.lotNumber,
                    expirationDate: firstCartridgeConsumable.expiresOn.toJSON(),
                  },
                },
              })
              .then(res => {
                assert.equal(res.status, 200)
              })

            const inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)

            assayConsumables.forEach(assayConsumable => {
              const inventoryItemBefore = _.find(inventoryItemsBefore, {
                consumableId: assayConsumable.consumableId,
              })
              const inventoryItemAfter = _.find(inventoryItemsAfter, {
                consumableId: assayConsumable.consumableId,
              })
              assert.isNull(inventoryItemAfter.lotNumber)
              if (inventoryItemBefore) {
                assert.equal(
                  inventoryItemAfter.quantityOnHand,

                  inventoryItemBefore.quantityOnHand - assayConsumable.quantity
                )
              }
            })
          }
        })
      )
    })

    it('should try to deduct the correct inventory item based on expiration date', async () => {
      const { deviceId, deviceAuth, now, user } = context
      const past = new Date(+now - 36000)
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const { id: adminId } = await knex('User').where({ name: user }).first('id')
      const assayExternalId = 'GxMtbRif'
      const gxMtbRifCartridgeId = (
        await knex('Consumable as c').where('c.externalId', 'GxMtbRifCartridge').first('c.id')
      ).id

      let resultDetails = {
        lotNumber: 'ABC123',
        expirationDate: '2045-01-30 00:00:00Z',
      }

      const [lotNumberAndExpirationDateMatch] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: resultDetails.lotNumber,
        expiresOn: new Date(resultDetails.expirationDate),
        quantityOnHand: 20,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })

      const { quantity: inventoryConsumedByTest } = await knex('ConsumableAssay as ca')
        .join('Assay as a', 'ca.assayId', 'a.id')
        .where('a.externalId', assayExternalId)
        .andWhere('ca.consumableId', gxMtbRifCartridgeId)
        .first('ca.quantity')

      let cartridgeAtSiteBefore = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem => inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: assayExternalId },
            sample: {
              id: Math.random().toString(36).slice(2),
            },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      let cartridgeAtSiteAfter = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem => inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      assert.equal(
        cartridgeAtSiteAfter.quantityOnHand,

        cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest
      )

      resultDetails = {
        lotNumber: 'XYZ321',
        expirationDate: '2035-01-30 00:00:00Z',
      }
      const randomExpiryDate = new Date('2017-03-05 00:00:00Z')
      const [onlyLotNumberMatches] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: resultDetails.lotNumber,
        expiresOn: randomExpiryDate,
        quantityOnHand: 30,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })
      cartridgeAtSiteBefore = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem => inventoryItem.expiresOn.toISOString() === randomExpiryDate.toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: assayExternalId },
            sample: {
              id: Math.random().toString(36).slice(2),
            },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: randomExpiryDate,
            },
          },
        })
        .expect(200)

      cartridgeAtSiteAfter = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem => inventoryItem.expiresOn.toISOString() === randomExpiryDate.toISOString()
      )

      assert.equal(
        cartridgeAtSiteAfter.quantityOnHand,

        cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest
      )

      resultDetails = {
        lotNumber: 'ABC123',
        expirationDate: '2019-11-16 00:00:00Z',
      }
      const randomLotNumber = 'RANDOM-LOT'
      const [onlyExpirationDateMatches] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: randomLotNumber,
        expiresOn: new Date(resultDetails.expirationDate),
        quantityOnHand: 45,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })
      cartridgeAtSiteBefore = _.find(
        await getInventoryItemsAtSite(knex, siteId),
        inventoryItem => inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: assayExternalId },
            sample: {
              id: Math.random().toString(36).slice(2),
            },
            instrument: { serial: '02384702' },
            consumable: {
              lot: randomLotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      const inventoryAfter = await getInventoryItemsAtSite(knex, siteId)
      cartridgeAtSiteAfter = _.find(
        inventoryAfter,
        inventoryItem => inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      await knex('InventoryLog')
        .whereIn('inventoryItemId', [lotNumberAndExpirationDateMatch, onlyLotNumberMatches, onlyExpirationDateMatches])
        .del()
      await knex('InventoryItem')
        .whereIn('id', [lotNumberAndExpirationDateMatch, onlyLotNumberMatches, onlyExpirationDateMatches])
        .del()

      assert.equal(
        cartridgeAtSiteAfter.quantityOnHand,

        cartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest
      )
    })

    it('should try to deduct the correct inventory item based on expiration date', async () => {
      const { deviceId, deviceAuth, now, user } = context
      const past = new Date(+now - 36000)
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const { id: adminId } = await knex('User').where({ name: user }).first('id')
      const assayExternalId = 'GxMtbRif'
      const gxMtbRifCartridgeId = (
        await knex('Consumable as c').where('c.externalId', 'GxMtbRifCartridge').first('c.id')
      ).id
      const inventoryConsumedByTest = (
        await knex('ConsumableAssay as ca')
          .join('Assay as a', 'ca.assayId', 'a.id')
          .where('a.externalId', assayExternalId)
          .andWhere('ca.consumableId', gxMtbRifCartridgeId)
          .first('ca.quantity')
      ).quantity

      const resultDetails = {
        lotNumber: 'QWE987',
        expirationDate: '2017-12-16 00:00:00Z',
      }
      const randomExpiryDate = new Date('2017-03-05 00:00:00Z')
      const [onlyLotNumberMatches] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: resultDetails.lotNumber,
        expiresOn: randomExpiryDate,
        quantityOnHand: 30,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })
      const randomLotNumber = 'SOME-LOT-NUMBER'
      const [onlyExpirationDateMatches] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: randomLotNumber,
        expiresOn: new Date(resultDetails.expirationDate),
        quantityOnHand: 45,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })
      const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)
      const matchingLotNumberCartridgeAtSiteBefore = _.find(
        inventoryItemsBefore,
        inventoryItem =>
          inventoryItem.lotNumber === resultDetails.lotNumber &&
          inventoryItem.expiresOn.toISOString() === new Date(randomExpiryDate).toISOString()
      )
      const matchingExpirationDateCartridgeAtSiteBefore = _.find(
        inventoryItemsBefore,
        inventoryItem =>
          inventoryItem.lotNumber === randomLotNumber &&
          inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: assayExternalId },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .then(res => {
          assert.equal(res.status, 200)
        })

      const inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)

      await knex('InventoryLog').whereIn('inventoryItemId', [onlyLotNumberMatches, onlyExpirationDateMatches]).del()
      await knex('InventoryItem').whereIn('id', [onlyLotNumberMatches, onlyExpirationDateMatches]).del()

      const matchingLotNumberCartridgeAtSiteAfter = _.find(
        inventoryItemsAfter,
        inventoryItem =>
          inventoryItem.lotNumber === resultDetails.lotNumber &&
          inventoryItem.expiresOn.toISOString() === randomExpiryDate.toISOString()
      )
      const matchingExpirationDateCartridgeAtSiteAfter = _.find(
        inventoryItemsAfter,
        inventoryItem => inventoryItem.expiresOn.toISOString() === new Date(resultDetails.expirationDate).toISOString()
      )

      assert.equal(
        matchingLotNumberCartridgeAtSiteAfter.quantityOnHand,
        matchingLotNumberCartridgeAtSiteBefore.quantityOnHand
      )

      assert.equal(
        matchingExpirationDateCartridgeAtSiteAfter.quantityOnHand,

        matchingExpirationDateCartridgeAtSiteBefore.quantityOnHand - inventoryConsumedByTest
      )
    })

    it('should deduct inventory item with expiresOn', async () => {
      const { deviceId, deviceAuth, now, user } = context
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const { id: adminId } = await knex('User').where({ name: user }).first('id')

      const past = subDays(now, 1)
      const future = addDays(startOfDay(now), 7)

      const assayExternalId = 'GxMtbRif'
      const { id: gxMtbRifCartridgeId } = await knex('Consumable as c')
        .where('c.externalId', 'GxMtbRifCartridge')
        .first('c.id')

      // Remove inventory item if it already exists
      await knex('InventoryItem').where({ consumableId: gxMtbRifCartridgeId, siteId }).del()

      const [inventoryItemId] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: null,
        expiresOn: future.toISOString().split('T')[0],
        quantityOnHand: 50,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })

      const { quantity: inventoryConsumedByTest } = await knex('ConsumableAssay as ca')
        .join('Assay as a', 'ca.assayId', 'a.id')
        .where('a.externalId', assayExternalId)
        .andWhere('ca.consumableId', gxMtbRifCartridgeId)
        .first('ca.quantity')

      const resultDetails = {
        lotNumber: 'HIV582',
        expirationDate: startOfDay(future).toISOString(),
      }

      const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)
      const inventoryItemBefore = _.find(inventoryItemsBefore, {
        id: inventoryItemId,
      })
      assert.isOk(inventoryItemBefore)
      assert.isNotOk(inventoryItemBefore.lotNumber)
      assert.equal(inventoryItemBefore.expiresOn.toISOString(), future.toISOString())
      assert.equal(inventoryItemBefore.quantityOnHand, 50)

      const inventoryLogsBefore = await knex('InventoryLog').where({ inventoryItemId }).select('id')
      assert.equal(inventoryLogsBefore.length, 0)

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', b: 'c' },
            assay: { id: assayExternalId },
            sample: { id: 'New Test Deduct From Null Item' },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .then(res => {
          assert.equal(res.status, 200)
        })

      const inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))
      const inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })
      assert.isNotOk(inventoryItemAfter.lotNumber)
      assert.equal(inventoryItemAfter.expiresOn.toISOString(), future.toISOString())
      assert.equal(inventoryItemAfter.quantityOnHand, inventoryItemBefore.quantityOnHand - inventoryConsumedByTest)

      const inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).select()
      assert.equal(inventoryLogsAfter.length, 1)

      const inventoryLog = inventoryLogsAfter[0]
      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      const result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, 'New Test Deduct From Null Item')
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )
    })

    it('should update quantityOnHand only if the result does not exists on InventoryLog', async () => {
      const { deviceId, deviceAuth, now, user } = context
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const { id: adminId } = await knex('User').where({ name: user }).first('id')

      const past = subDays(now, 1)
      const future = addDays(now, 7)
      const futureExpiresOn = startOfDay(future)

      const assayExternalId = 'GxMtbRif'
      const { id: gxMtbRifCartridgeId } = await knex('Consumable as c')
        .where('c.externalId', 'GxMtbRifCartridge')
        .first('c.id')

      await knex('InventoryItem').where({ consumableId: gxMtbRifCartridgeId, siteId }).del()

      const [inventoryItemId] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: 'HIV58210',
        expiresOn: futureExpiresOn,
        quantityOnHand: 50,
        createdBy: adminId,
        createdOn: past,
        updatedBy: adminId,
        updatedOn: past,
      })

      const { quantity: inventoryConsumedByTest } = await knex('ConsumableAssay as ca')
        .join('Assay as a', 'ca.assayId', 'a.id')
        .where('a.externalId', assayExternalId)
        .andWhere('ca.consumableId', gxMtbRifCartridgeId)
        .first('ca.quantity')

      const resultDetails = {
        lotNumber: 'HIV58210',
        expirationDate: futureExpiresOn.toISOString(),
      }

      const inventoryItemsBefore = await getInventoryItemsAtSite(knex, siteId)
      const inventoryItemBefore = _.find(inventoryItemsBefore, {
        id: inventoryItemId,
      })
      assert.isOk(inventoryItemBefore)
      assert.equal(inventoryItemBefore.lotNumber, resultDetails.lotNumber)
      assert.equal(inventoryItemBefore.expiresOn.toISOString(), futureExpiresOn.toISOString())

      assert.equal(inventoryItemBefore.quantityOnHand, 50)

      const inventoryLogsBefore = await knex('InventoryLog').where({ inventoryItemId }).select('id')
      assert.equal(inventoryLogsBefore.length, 0)
      const fakeResultId = 'fake-result-id'
      const fakeSampleId = 'fake-sample-id'
      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            id: fakeResultId,
            startedOn: past,
            data: { assay: 'Xpert MTB-RIF', b: 'c' },
            assay: { id: assayExternalId },
            sample: { id: fakeSampleId },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      let inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)

      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))
      let inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })
      assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
      assert.equal(inventoryItemAfter.expiresOn.toISOString(), futureExpiresOn.toISOString())
      assert.equal(inventoryItemBefore.id, inventoryItemAfter.id, 'Inventory Item used is the one created by the test')

      assert.equal(
        inventoryItemAfter.quantityOnHand,
        inventoryItemBefore.quantityOnHand - inventoryConsumedByTest,
        'Quantity on Hand must be updated after first result'
      )

      let inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).select()

      assert.equal(inventoryLogsAfter.length, 1)

      let [inventoryLog] = inventoryLogsAfter
      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      let result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, fakeSampleId)
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )

      // Simulate external quantity on hand change
      const newQuantityOnHand = 30
      await knex('InventoryItem')
        .where({ id: inventoryItemId })
        .update({ updatedOn: now, quantityOnHand: newQuantityOnHand })

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            id: fakeResultId,
            startedOn: past,
            data: { assay: 'Xpert MTB-RIF', b: 'd' },
            assay: { id: assayExternalId },
            sample: { id: fakeSampleId },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))
      inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })

      assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)

      assert.equal(inventoryItemAfter.expiresOn.toISOString(), futureExpiresOn.toISOString())

      assert.equal(
        inventoryItemAfter.quantityOnHand,
        newQuantityOnHand,
        'Quantity on Hand must not be updated after second result'
      )

      inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).orderBy('id', 'desc').select()

      assert.equal(inventoryLogsAfter.length, 1)
      ;[inventoryLog] = inventoryLogsAfter

      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, fakeSampleId)
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            id: fakeResultId,
            startedOn: past,
            data: { assay: 'Xpert MTB-RIF', b: 'e' },
            assay: { id: assayExternalId },
            sample: { id: fakeSampleId },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      inventoryItemsAfter = await getInventoryItemsAtSite(knex, siteId)
      assert.deepEqual(_.map(inventoryItemsBefore, 'id'), _.map(inventoryItemsAfter, 'id'))
      inventoryItemAfter = _.find(inventoryItemsAfter, {
        id: inventoryItemId,
      })
      assert.equal(inventoryItemAfter.lotNumber, resultDetails.lotNumber)
      assert.isOk(inventoryItemAfter.expiresOn)
      assert.equal(inventoryItemAfter.quantityOnHand, newQuantityOnHand)

      inventoryLogsAfter = await knex('InventoryLog').where({ inventoryItemId }).orderBy('id', 'desc').select()
      assert.equal(inventoryLogsAfter.length, 1)
      ;[inventoryLog] = inventoryLogsAfter
      assert.equal(inventoryLog.inventoryItemId, inventoryItemId)
      assert.isOk(inventoryLog.resultId)

      result = await getResult(knex, inventoryLog.resultId)
      assert.equal(result.sample.id, fakeSampleId)
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )
    })
    it('if no Inventory Item is found, record should be unreconciled and should  not add a new item with negative quantity on hand', async () => {
      const { deviceId, deviceAuth, now, user } = context
      const fakeSampleId = 'New Test Add Negative Quantity'
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')

      const { id: adminId } = await knex('User').where({ name: user }).first('id')

      const past = subDays(now, 1)
      const future = addDays(now, 7)

      const assayExternalId = 'GxMtbRif'
      const { id: gxMtbRifCartridgeId } = await knex('Consumable as c')
        .where('c.externalId', 'GxMtbRifCartridge')
        .first('c.id')

      // Remove inventory item if it already exists
      await knex('InventoryItem').where({ consumableId: gxMtbRifCartridgeId, siteId }).del()

      const [inventoryItemNotAsCloseId] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: 'not as close',
        expiresOn: addDays(future, 2),
        quantityOnHand: 40,
        createdBy: adminId,
        createdOn: subDays(past, 3),
        updatedBy: adminId,
        updatedOn: past,
      })
      const [inventoryItemClosestId] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: 'closest',
        expiresOn: addDays(future, 1),
        quantityOnHand: 30,
        createdBy: adminId,
        createdOn: subDays(past, 2),
        updatedBy: adminId,
        updatedOn: past,
      })

      const [inventoryItemStillNotAsCloseId] = await knex('InventoryItem').insert({
        consumableId: gxMtbRifCartridgeId,
        siteId,
        lotNumber: 'still not as close',
        expiresOn: subDays(future, 2),
        quantityOnHand: 50,
        createdBy: adminId,
        createdOn: subDays(past, 4),
        updatedBy: adminId,
        updatedOn: past,
      })

      const resultDetails = {
        lotNumber: null,
        expirationDate: startOfDay(future),
      }

      const res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', b: 'c' },
            assay: { id: assayExternalId },
            sample: { id: fakeSampleId },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      const resultId = res.body.aspectResultId
      const unreconciledResult = await knex('Result')
        .whereNull('reconciliationDate')
        .where('id', res.body.aspectResultId)
      assert.equal(unreconciledResult.length, 1, 'Unreconciled Result must exist')

      const inventoryItemsAfter = await (
        await getInventoryItemsAtSite(knex, siteId)
      ).filter(
        ii => ![inventoryItemNotAsCloseId, inventoryItemClosestId, inventoryItemStillNotAsCloseId].includes(ii.id)
      )

      assert.equal(inventoryItemsAfter.length, 0, 'Must be 0 item after the inventory handling')

      const result = await getResult(knex, resultId)
      assert.equal(result.sample.id, fakeSampleId)
      assert.equal(result.consumable[0].lot, resultDetails.lotNumber)
      assert.equal(
        parseDateOrDefault(result.consumable[0].expirationDate).toISOString(),
        parseDateOrDefault(resultDetails.expirationDate).toISOString()
      )
    })

    it('should not log inventory consumption when no inventory item exists for site', async () => {
      const { deviceId, deviceAuth, now } = context
      const { siteId } = await knex('Device').where({ id: deviceId }).first('siteId')
      const assayExternalId = 'GxMtbRif'
      const gxMtbRifCartridgeId = (
        await knex('Consumable as c').where('c.externalId', 'GxMtbRifCartridge').first('c.id')
      ).id
      // Remove inventory item if it already exists
      await knex('InventoryItem').where({ consumableId: gxMtbRifCartridgeId, siteId }).del()

      const resultDetails = {
        lotNumber: 'HIV533',
        expirationDate: getLocalDateInUtc(
          new Date(new Date().getTime() + _.random(0, 1000 * 60 * 60 * 24 * 365)).setHours(0, 0, 0, 0)
        ),
      }

      const res = await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: now,
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: assayExternalId },
            sample: { id: 'New Test Deduct Unknown Item' },
            instrument: { serial: '02384702' },
            consumable: {
              lot: resultDetails.lotNumber,
              expirationDate: resultDetails.expirationDate,
            },
          },
        })
        .expect(200)

      const resultId = res.body.aspectResultId
      const inventoryLogsAfter = await knex('InventoryLog').where('inventoryItemId', resultId).select()
      assert.equal(inventoryLogsAfter.length, 0, 'InventoryLog must not exist for the unreconciled record')
    })
  })
})
