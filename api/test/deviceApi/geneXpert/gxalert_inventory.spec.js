const _ = require('lodash')
const chai = require('chai')
const chaiSubset = require('chai-subset')
const {
  setMilliseconds,
  addHours,
  subHours,
  subDays,
  addYears,
  format: dateFormat,
} = require('date-fns')

const { createGxAlertTestContext } = require('./gxalert_utils')
const { postToDeviceApi } = require('../utils')
const { knex } = require('../../../src/db')

const server = require('../../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('Device API routes for GxAlert Device', () => {
  function createContext() {
    return createGxAlertTestContext(server)
  }
  describe('inventory changes With Lot and Expiration Date', () => {
    const gxAlertDeviceId = 4412
    const initialQuantityOnHand = 100
    const deviceName = 'GeneXpert Device with Inventory Changes'
    const context = createContext()
    const {
      beforeCreateGxAlertApiKey,
      useGxAlertDeviceId,
      getCurrentGeneXpertDevice,
      afterCleanUp,
    } = context
    let { deviceAuth, basicDevicePayload } = context
    let geneXpertDevice
    beforeEach(async () => {
      await beforeCreateGxAlertApiKey()
      useGxAlertDeviceId(gxAlertDeviceId)
      ;({ deviceAuth, basicDevicePayload } = context)
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
        }),
      })
      geneXpertDevice = await getCurrentGeneXpertDevice()
    })

    afterEach(afterCleanUp)

    it('should create inventory items that do not exist', async () => {
      const now = new Date()
      const inventoryItemsAtSiteBefore = await knex('InventoryItem')
        .where({ siteId: geneXpertDevice.siteId })
        .select()
      assert.isEmpty(inventoryItemsAtSiteBefore)

      const startedOn = subHours(subDays(now, 1), 2)
      const endedOn = subHours(now, 2)
      const expirationDate = dateFormat(
        new Date(addYears(now, 1).setHours(0, 0, 0, 0)),
        "yyyy-MM-dd'T'HH:mm:ss'Z'"
      )
      const consumableName = 'Xpert HIV-1 Qual Cartridge'
      const consumableReason = 'Captured'
      const initialQuantity = 100
      const quantity = 5

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: {
              inventoryChanges: [
                {
                  consumableName,
                  consumableReasonName: consumableReason,
                  quantity,
                  resultingQuantityOnHand: initialQuantity + quantity,
                  dateChanged: startedOn,
                  expirationDate,
                },
              ],
            },
          },
        }),
      })

      const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ siteId: geneXpertDevice.siteId })
        .select(
          'ii.id',
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      expect(inventoryItemsAtSiteAfter).to.containSubset([
        {
          consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: new Date(expirationDate),
          quantityOnHand: _.max([0, initialQuantity + quantity]),
        },
      ])

      const inventoryLog = await knex('InventoryLog as il')
        .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
        .join('Consumable as c', 'il.consumableId', 'c.id')
        .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
        .select(
          'c.name as consumableName',
          'il.siteId',
          'cr.name as consumableReason',
          'il.resultId',
          'il.operation',
          'il.lotNumber',
          'il.expiresOn',
          'il.quantity',
          'il.notes',
          'il.adjustedFrom',
          'il.adjustedTo'
        )

      assert.deepEqual(inventoryLog, [
        {
          consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: new Date(expirationDate),
          quantity,
          notes: null,
          adjustedFrom: setMilliseconds(startedOn, 0),
          adjustedTo: null,
        },
      ])
    })

    describe('inventory update', () => {
      beforeEach(async () => {
        const consumableAssay = await knex('ConsumableAssay as ca')
          .join('Assay as a', 'ca.assayId', 'a.id')
          .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
          .where({ 'dt.externalId': basicDevicePayload.type.id })
          .andWhere('ca.quantity', '>', 0)
          .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

        assert.isNotEmpty(consumableAssay)
        assert.isAbove(consumableAssay.quantity, 0)

        const expiryDate = new Date(
          addYears(new Date(), 1).setHours(0, 0, 0, 0)
        )
        await knex('InventoryItem').insert({
          consumableId: consumableAssay.consumableId,
          siteId: geneXpertDevice.siteId,
          expiresOn: expiryDate,
          quantityOnHand: initialQuantityOnHand,
        })
      })

      it('should respond the inventory items that have been updated', async () => {
        const now = new Date()
        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = dateFormat(
          new Date(addYears(now, 1).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )
        const consumableName = 'Xpert HIV-1 Qual Cartridge'
        const consumableReason = 'Captured'
        const initialQuantity = 100
        const quantity = 5

        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand: initialQuantity + quantity,
                    dateChanged: startedOn,
                    expirationDate,
                  },
                ],
              },
            },
          }),
        })
        expect(response.body.inventoryItems).to.containSubset([
          {
            consumableName,
            quantityOnHand: _.max([0, initialQuantity + quantity]),
            expiresOn: new Date(expirationDate).toJSON(),
          },
        ])
      })

      it('should ignore changes for consumables that are unknown', async () => {
        const now = new Date()
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .select()

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = dateFormat(
          new Date(addYears(now, 1).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName: 'Unknown consumable type',
                    consumableReasonName: 'Captured',
                    quantity: 12,
                    resultingQuantityOnHand: 112,
                    dateChanged: startedOn,
                    expirationDate,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .select()
        assert.deepEqual(inventoryItemsAtSiteBefore, inventoryItemsAtSiteAfter)
      })

      it('should accept all types of GeneXpert cartridges', async () => {
        const now = new Date()
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .pluck('id')

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'

        const inventoryChanges = [
          {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: consumableReason,
            quantity: 13,
            resultingQuantityOnHand: 86,
            dateChanged: addHours(startedOn, 1),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 1).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'GeneXpert Ebola Cartridge',
            consumableReasonName: consumableReason,
            quantity: 3,
            resultingQuantityOnHand: 21,
            dateChanged: addHours(startedOn, 2),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Qual Cartridge',
            consumableReasonName: consumableReason,
            quantity: 44,
            resultingQuantityOnHand: 50,
            dateChanged: addHours(startedOn, 3),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Viral Load Cartridge',
            consumableReasonName: consumableReason,
            quantity: 1,
            resultingQuantityOnHand: 13,
            dateChanged: addHours(startedOn, 4),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 4).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'GeneXpert TB Ultra Cartridge',
            consumableReasonName: consumableReason,
            quantity: 26,
            resultingQuantityOnHand: 41,
            dateChanged: addHours(startedOn, 5),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 8).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
        ]

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfter).to.containSubset(
          _.map(inventoryChanges, inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(inventoryChange.expirationDate),
            quantityOnHand: inventoryChange.resultingQuantityOnHand,
          }))
        )

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .select(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset(
          _.map(inventoryChanges, inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: new Date(inventoryChange.expirationDate),
            quantity: Math.abs(inventoryChange.quantity),
            notes: null,
            adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
            adjustedTo: null,
          }))
        )
      })

      it('should increase the quantity inventory items that do exist', async () => {
        const now = new Date()
        const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .orderBy(['ii.createdOn', 'ii.id'])
          .first(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.isNotEmpty(inventoryItemAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'
        const quantity = 13

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName: inventoryItemAtSiteBefore.consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand:
                      inventoryItemAtSiteBefore.quantityOnHand + quantity,
                    dateChanged: startedOn,
                    expirationDate: inventoryItemAtSiteBefore.expiresOn,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': inventoryItemAtSiteBefore.id })
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfter).to.containSubset([
          {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: inventoryItemAtSiteBefore.expiresOn,
            quantityOnHand: _.max([
              0,
              inventoryItemAtSiteBefore.quantityOnHand + quantity,
            ]),
          },
        ])

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .orderBy('il.id', 'desc')
          .first(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset({
          consumableName: inventoryItemAtSiteBefore.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: inventoryItemAtSiteBefore.expiresOn,
          quantity,
          notes: null,
          adjustedFrom: setMilliseconds(startedOn, 0),
          adjustedTo: null,
        })
      })

      it('should decrease the quantity on hand of existing inventory items', async () => {
        const now = new Date()
        const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .orderBy(['ii.createdOn', 'ii.id'])
          .first(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.isNotEmpty(inventoryItemAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'
        const quantity = -3

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName: inventoryItemAtSiteBefore.consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand:
                      inventoryItemAtSiteBefore.quantityOnHand + quantity,
                    dateChanged: startedOn,
                    expirationDate: inventoryItemAtSiteBefore.expiresOn,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': inventoryItemAtSiteBefore.id })
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )

        expect(inventoryItemsAtSiteAfter).to.containSubset([
          {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: inventoryItemAtSiteBefore.expiresOn,
            quantityOnHand: _.max([
              0,
              inventoryItemAtSiteBefore.quantityOnHand + quantity,
            ]),
          },
        ])

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .orderBy('il.id', 'desc')
          .first(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset({
          consumableName: inventoryItemAtSiteBefore.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason,
          resultId: null,
          operation: 'remove from GxConnect',
          lotNumber: null,
          expiresOn: inventoryItemAtSiteBefore.expiresOn,
          quantity: Math.abs(quantity),
          notes: null,
          adjustedFrom: setMilliseconds(startedOn, 0),
          adjustedTo: null,
        })
      })
    })

    it('should accept different reasons', async () => {
      const now = new Date()
      const inventoryItemsAtSiteBefore = await knex('InventoryItem')
        .where({ siteId: geneXpertDevice.siteId })
        .pluck('id')

      const startedOn = subDays(now, 1)
      const endedOn = addHours(startedOn, 2)

      const inventoryChanges = [
        {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Captured',
          quantity: 13,
          resultingQuantityOnHand: 73,
          dateChanged: subHours(startedOn, 1),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 5).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'GeneXpert Ebola Cartridge',
          consumableReasonName: 'Captured',
          quantity: -3,
          resultingQuantityOnHand: 18,
          dateChanged: subHours(startedOn, 2),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 6).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'Xpert HIV-1 Qual Cartridge',
          consumableReasonName: 'Transfer Sent',
          quantity: -4,
          resultingQuantityOnHand: 46,
          dateChanged: subHours(startedOn, 3),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 8).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'Xpert HIV-1 Viral Load Cartridge',
          consumableReasonName: 'Transfer Received',
          quantity: 11,
          resultingQuantityOnHand: 24,
          dateChanged: subHours(startedOn, 4),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'GeneXpert TB Ultra Cartridge',
          consumableReasonName: 'Lost',
          quantity: -6,
          resultingQuantityOnHand: 30,
          dateChanged: subHours(startedOn, 5),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 7).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Expired',
          quantity: -6,
          resultingQuantityOnHand: 50,
          dateChanged: subHours(startedOn, 6),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 2).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
      ]

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: { inventoryChanges },
          },
        }),
      })

      const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ siteId: geneXpertDevice.siteId })
        .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
        .select(
          'ii.id',
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      expect(inventoryItemsAtSiteAfter).to.containSubset(
        _.map(inventoryChanges, inventoryChange => ({
          consumableName: inventoryChange.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: new Date(inventoryChange.expirationDate),
          quantityOnHand: inventoryChange.resultingQuantityOnHand,
        }))
      )

      const inventoryLog = await knex('InventoryLog as il')
        .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
        .join('Consumable as c', 'il.consumableId', 'c.id')
        .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
        .select(
          'c.name as consumableName',
          'il.siteId',
          'cr.name as consumableReason',
          'il.resultId',
          'il.operation',
          'il.lotNumber',
          'il.expiresOn',
          'il.quantity',
          'il.notes',
          'il.adjustedFrom',
          'il.adjustedTo'
        )

      expect(inventoryLog).to.containSubset(
        _.map(inventoryChanges, inventoryChange => ({
          consumableName: inventoryChange.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: inventoryChange.consumableReasonName,
          resultId: null,
          operation:
            inventoryChange.quantity >= 0
              ? 'add from GxConnect'
              : 'remove from GxConnect',
          lotNumber: null,
          expiresOn: new Date(inventoryChange.expirationDate),
          quantity: Math.abs(inventoryChange.quantity),
          notes: null,
          adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
          adjustedTo: null,
        }))
      )
    })

    it('should identify lots based on expiration date and adjust the quantity of the correct lot', async () => {
      const now = new Date()
      const inventoryItemsAtSiteBefore = await knex('InventoryItem')
        .where({ siteId: geneXpertDevice.siteId })
        .pluck('id')

      const startedOn = subDays(now, 5)
      const endedOn = addHours(startedOn, 2)

      const lot1 = {
        consumableName: 'GeneXpert TB Cartridge',
        consumableReasonName: 'Captured',
        quantity: 73,
        resultingQuantityOnHand: 73,
        dateChanged: subHours(startedOn, 2),
        expirationDate: dateFormat(
          new Date(subDays(addYears(now, 1), 21).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        ),
      }
      const lot2 = {
        consumableName: 'GeneXpert TB Cartridge',
        consumableReasonName: 'Captured',
        quantity: 38,
        resultingQuantityOnHand: 38,
        dateChanged: subHours(startedOn, 2),
        expirationDate: dateFormat(
          new Date(subDays(addYears(now, 1), 33).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        ),
      }

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: { inventoryChanges: [lot1, lot2] },
          },
        }),
      })

      const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ siteId: geneXpertDevice.siteId })
        .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
        .select(
          'ii.id',
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      expect(inventoryItemsAtSiteAfter).to.containSubset(
        _.map([lot1, lot2], inventoryChange => ({
          consumableName: inventoryChange.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: new Date(inventoryChange.expirationDate),
          quantityOnHand: inventoryChange.resultingQuantityOnHand,
        }))
      )

      const inventoryLogs = await knex('InventoryLog as il')
        .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
        .join('Consumable as c', 'il.consumableId', 'c.id')
        .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
        .select(
          'il.id',
          'c.name as consumableName',
          'il.siteId',
          'cr.name as consumableReason',
          'il.resultId',
          'il.operation',
          'il.lotNumber',
          'il.expiresOn',
          'il.quantity',
          'il.notes',
          'il.adjustedFrom',
          'il.adjustedTo'
        )

      expect(inventoryLogs).to.containSubset(
        _.map([lot1, lot2], inventoryChange => ({
          consumableName: inventoryChange.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: inventoryChange.consumableReasonName,
          resultId: null,
          operation:
            inventoryChange.quantity >= 0
              ? 'add from GxConnect'
              : 'remove from GxConnect',
          lotNumber: null,
          expiresOn: new Date(inventoryChange.expirationDate),
          quantity: Math.abs(inventoryChange.quantity),
          notes: null,
          adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
          adjustedTo: null,
        }))
      )

      const updateToLot1 = _.assign({}, lot1, {
        consumableReasonName: 'Stolen',
        quantity: -3,
        resultingQuantityOnHand: 70,
        dateChanged: subHours(startedOn, 1),
      })

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: { inventoryChanges: [updateToLot1] },
          },
        }),
      })

      const lot1InventoryItem = _.find(inventoryItemsAtSiteAfter, {
        expiresOn: new Date(lot1.expirationDate),
      })
      const lot2InventoryItem = _.find(inventoryItemsAtSiteAfter, {
        expiresOn: new Date(lot2.expirationDate),
      })
      const lot1InventoryItemAfterAdjustment1 = await knex(
        'InventoryItem as ii'
      )
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ 'ii.id': lot1InventoryItem.id })
        .first(
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      const lot2InventoryItemAfterAdjustment1 = await knex(
        'InventoryItem as ii'
      )
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ 'ii.id': lot2InventoryItem.id })
        .first(
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      assert.deepEqual(lot1InventoryItemAfterAdjustment1, {
        consumableName: lot1.consumableName,
        inTransitFromSiteId: null,
        lotNumber: null,
        expiresOn: new Date(lot1.expirationDate),
        quantityOnHand: _.max([
          0,
          lot1InventoryItem.quantityOnHand + updateToLot1.quantity,
        ]),
      })
      assert.deepEqual(lot2InventoryItemAfterAdjustment1, {
        consumableName: lot2.consumableName,
        inTransitFromSiteId: null,
        lotNumber: null,
        expiresOn: new Date(lot2.expirationDate),
        quantityOnHand: lot2.resultingQuantityOnHand,
      })

      const updateToLot2 = _.assign({}, lot2, {
        consumableReasonName: 'Transfer Received',
        quantity: 100,
        resultingQuantityOnHand: 138,
        dateChanged: subHours(startedOn, 1),
      })

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: { inventoryChanges: [updateToLot2] },
          },
        }),
      })

      const lot1InventoryItemAfterAdjustment2 = await knex(
        'InventoryItem as ii'
      )
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ 'ii.id': lot1InventoryItem.id })
        .first(
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      const lot2InventoryItemAfterAdjustment2 = await knex(
        'InventoryItem as ii'
      )
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ 'ii.id': lot2InventoryItem.id })
        .first(
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      assert.deepEqual(lot1InventoryItemAfterAdjustment2, {
        consumableName: lot1.consumableName,
        inTransitFromSiteId: null,
        lotNumber: null,
        expiresOn: new Date(lot1.expirationDate),
        quantityOnHand: _.max([
          0,
          lot1InventoryItem.quantityOnHand + updateToLot1.quantity,
        ]),
      })
      assert.deepEqual(lot2InventoryItemAfterAdjustment2, {
        consumableName: lot2.consumableName,
        inTransitFromSiteId: null,
        lotNumber: null,
        expiresOn: new Date(lot2.expirationDate),
        quantityOnHand: _.max([
          0,
          lot2InventoryItem.quantityOnHand + updateToLot2.quantity,
        ]),
      })
      const inventoryLogsForLot1And2 = await knex('InventoryLog as il')
        .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
        .join('Consumable as c', 'il.consumableId', 'c.id')
        .whereIn('il.inventoryItemId', [
          lot1InventoryItem.id,
          lot2InventoryItem.id,
        ])
        .orderBy('il.id')
        .select(
          'c.name as consumableName',
          'il.siteId',
          'cr.name as consumableReason',
          'il.resultId',
          'il.operation',
          'il.lotNumber',
          'il.expiresOn',
          'il.quantity',
          'il.notes',
          'il.adjustedFrom',
          'il.adjustedTo'
        )
      expect(inventoryLogsForLot1And2).to.containSubset([
        {
          consumableName: lot1.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: lot1.consumableReasonName,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: new Date(lot1.expirationDate),
          quantity: Math.abs(lot1.resultingQuantityOnHand),
          notes: null,
          adjustedFrom: setMilliseconds(lot1.dateChanged, 0),
          adjustedTo: null,
        },
        {
          consumableName: lot2.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: lot2.consumableReasonName,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: new Date(lot2.expirationDate),
          quantity: Math.abs(lot2.resultingQuantityOnHand),
          notes: null,
          adjustedFrom: setMilliseconds(lot2.dateChanged, 0),
          adjustedTo: null,
        },
        {
          consumableName: lot1.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: updateToLot1.consumableReasonName,
          resultId: null,
          operation: 'remove from GxConnect',
          lotNumber: null,
          expiresOn: new Date(lot1.expirationDate),
          quantity: Math.abs(updateToLot1.quantity),
          notes: null,
          adjustedFrom: setMilliseconds(updateToLot1.dateChanged, 0),
          adjustedTo: null,
        },
        {
          consumableName: lot2.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: updateToLot2.consumableReasonName,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: new Date(lot2.expirationDate),
          quantity: Math.abs(updateToLot2.quantity),
          notes: null,
          adjustedFrom: setMilliseconds(updateToLot2.dateChanged, 0),
          adjustedTo: null,
        },
      ])
    })

    describe('when quantity on hand is explicitly specified in the data', () => {
      it('should overwrite the quantity on hand in the inventory record', async () => {
        const now = new Date()
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .pluck('id')

        const startedOn = subDays(now, 7)
        const endedOn = addHours(startedOn, 2)
        const expirationDate = dateFormat(
          new Date(subDays(addYears(now, 1), 15).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )

        const initialLotCaptured = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Captured',
          quantity: 25,
          resultingQuantityOnHand: 25,
          dateChanged: subHours(startedOn, 2),
          expirationDate,
        }

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [initialLotCaptured] },
            },
          }),
        })

        const inventoryItemsAtSiteAfterCapture = await knex(
          'InventoryItem as ii'
        )
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfterCapture).to.containSubset([
          {
            consumableName: initialLotCaptured.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(initialLotCaptured.expirationDate),
            quantityOnHand: initialLotCaptured.resultingQuantityOnHand,
          },
        ])

        const inventoryLost = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Lost',
          quantity: -5,
          resultingQuantityOnHand: 999,
          dateChanged: subHours(startedOn, 1),
          expirationDate,
        }

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [inventoryLost] },
            },
          }),
        })

        const inventoryItemsAtSiteAfterLoss = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfterLoss).to.containSubset([
          {
            consumableName: inventoryLost.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(inventoryLost.expirationDate),
            quantityOnHand: inventoryLost.resultingQuantityOnHand,
          },
        ])
      })
    })

    describe('when quantity on hand is not specified in the data', () => {
      it('should calculate the quantity on hand in the inventory record', async () => {
        const now = new Date()
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .pluck('id')

        const startedOn = subDays(now, 9)
        const endedOn = addHours(startedOn, 2)
        const expirationDate = dateFormat(
          new Date(subDays(addYears(now, 1), 15).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )

        const initialLotCaptured = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Captured',
          quantity: 25,
          dateChanged: subHours(startedOn, 2),
          expirationDate,
        }

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [initialLotCaptured] },
            },
          }),
        })

        const inventoryItemsAtSiteAfterCapture = await knex(
          'InventoryItem as ii'
        )
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfterCapture).to.containSubset([
          {
            consumableName: initialLotCaptured.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(initialLotCaptured.expirationDate),
            quantityOnHand: initialLotCaptured.quantity,
          },
        ])

        const inventoryLost = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Lost',
          quantity: -5,
          dateChanged: subHours(startedOn, 1),
          expirationDate,
        }

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [inventoryLost] },
            },
          }),
        })

        const inventoryItemsAtSiteAfterLoss = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfterLoss).to.containSubset([
          {
            consumableName: inventoryLost.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(inventoryLost.expirationDate),
            quantityOnHand: _.max([
              0,
              initialLotCaptured.quantity + inventoryLost.quantity,
            ]),
          },
        ])
      })
    })
  })

  describe('inventory changes with Expiration Date', () => {
    const gxAlertDeviceId = 4412
    const initialQuantityOnHand = 100
    const deviceName = 'GeneXpert Device with Inventory Changes'
    const context = createContext()
    const {
      beforeCreateGxAlertApiKey,
      useGxAlertDeviceId,
      getCurrentGeneXpertDevice,
      afterCleanUp,
    } = context
    let { deviceAuth, basicDevicePayload } = context
    let geneXpertDevice
    beforeEach(async () => {
      await beforeCreateGxAlertApiKey()
      useGxAlertDeviceId(gxAlertDeviceId)
      ;({ deviceAuth, basicDevicePayload } = context)
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
        }),
      })
      geneXpertDevice = await getCurrentGeneXpertDevice()
    })

    afterEach(afterCleanUp)
    before(async () =>
      knex('Consumable').update({ strategy: 'withExpirationDateStrategy' })
    )
    after(async () =>
      knex('Consumable').update({
        strategy: 'withLotAndExpirationDateStrategy',
      })
    )
    it('should create inventory items that do not exist', async () => {
      const now = new Date()
      const inventoryItemsAtSiteBefore = await knex('InventoryItem')
        .where({ siteId: geneXpertDevice.siteId })
        .select()
      assert.isEmpty(inventoryItemsAtSiteBefore)

      const startedOn = subHours(subDays(now, 1), 2)
      const endedOn = subHours(now, 2)
      const expirationDate = dateFormat(
        new Date(addYears(now, 1).setHours(0, 0, 0, 0)),
        "yyyy-MM-dd'T'HH:mm:ss'Z'"
      )
      const consumableName = 'Xpert HIV-1 Qual Cartridge'
      const consumableReason = 'Captured'
      const initialQuantity = 100
      const quantity = 5

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: {
              inventoryChanges: [
                {
                  consumableName,
                  consumableReasonName: consumableReason,
                  quantity,
                  resultingQuantityOnHand: initialQuantity + quantity,
                  dateChanged: startedOn,
                  expirationDate,
                },
              ],
            },
          },
        }),
      })

      const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ siteId: geneXpertDevice.siteId })
        .select(
          'ii.id',
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      expect(inventoryItemsAtSiteAfter).to.containSubset([
        {
          consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: new Date(expirationDate),
          quantityOnHand: _.max([0, initialQuantity + quantity]),
        },
      ])

      const inventoryLog = await knex('InventoryLog as il')
        .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
        .join('Consumable as c', 'il.consumableId', 'c.id')
        .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
        .select(
          'c.name as consumableName',
          'il.siteId',
          'cr.name as consumableReason',
          'il.resultId',
          'il.operation',
          'il.lotNumber',
          'il.expiresOn',
          'il.quantity',
          'il.notes',
          'il.adjustedFrom',
          'il.adjustedTo'
        )

      assert.deepEqual(inventoryLog, [
        {
          consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: new Date(expirationDate),
          quantity,
          notes: null,
          adjustedFrom: setMilliseconds(startedOn, 0),
          adjustedTo: null,
        },
      ])
    })

    describe('inventory update', () => {
      beforeEach(async () => {
        const consumableAssay = await knex('ConsumableAssay as ca')
          .join('Assay as a', 'ca.assayId', 'a.id')
          .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
          .where({ 'dt.externalId': basicDevicePayload.type.id })
          .andWhere('ca.quantity', '>', 0)
          .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

        assert.isNotEmpty(consumableAssay)
        assert.isAbove(consumableAssay.quantity, 0)

        const expiryDate = new Date(
          addYears(new Date(), 1).setHours(0, 0, 0, 0)
        )
        await knex('InventoryItem').insert({
          consumableId: consumableAssay.consumableId,
          siteId: geneXpertDevice.siteId,
          expiresOn: expiryDate,
          quantityOnHand: initialQuantityOnHand,
        })
      })

      it('should respond the inventory items that have been updated', async () => {
        const now = new Date()
        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = dateFormat(
          new Date(addYears(now, 1).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )
        const consumableName = 'Xpert HIV-1 Qual Cartridge'
        const consumableReason = 'Captured'
        const initialQuantity = 100
        const quantity = 5

        const response = await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand: initialQuantity + quantity,
                    dateChanged: startedOn,
                    expirationDate,
                  },
                ],
              },
            },
          }),
        })
        expect(response.body.inventoryItems).to.containSubset([
          {
            consumableName,
            quantityOnHand: _.max([0, initialQuantity + quantity]),
            expiresOn: new Date(expirationDate).toJSON(),
          },
        ])
      })

      it('should ignore changes for consumables that are unknown', async () => {
        const now = new Date()
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .select()

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = dateFormat(
          new Date(addYears(now, 1).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName: 'Unknown consumable type',
                    consumableReasonName: 'Captured',
                    quantity: 12,
                    resultingQuantityOnHand: 112,
                    dateChanged: startedOn,
                    expirationDate,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .select()
        assert.deepEqual(inventoryItemsAtSiteBefore, inventoryItemsAtSiteAfter)
      })

      it('should accept all types of GeneXpert cartridges', async () => {
        const now = new Date()
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .pluck('id')

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'

        const inventoryChanges = [
          {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: consumableReason,
            quantity: 13,
            resultingQuantityOnHand: 86,
            dateChanged: addHours(startedOn, 1),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 1).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'GeneXpert Ebola Cartridge',
            consumableReasonName: consumableReason,
            quantity: 3,
            resultingQuantityOnHand: 21,
            dateChanged: addHours(startedOn, 2),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Qual Cartridge',
            consumableReasonName: consumableReason,
            quantity: 44,
            resultingQuantityOnHand: 50,
            dateChanged: addHours(startedOn, 3),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'Xpert HIV-1 Viral Load Cartridge',
            consumableReasonName: consumableReason,
            quantity: 1,
            resultingQuantityOnHand: 13,
            dateChanged: addHours(startedOn, 4),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 4).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
          {
            consumableName: 'GeneXpert TB Ultra Cartridge',
            consumableReasonName: consumableReason,
            quantity: 26,
            resultingQuantityOnHand: 41,
            dateChanged: addHours(startedOn, 5),
            expirationDate: dateFormat(
              new Date(subDays(addYears(now, 1), 8).setHours(0, 0, 0, 0)),
              "yyyy-MM-dd'T'HH:mm:ss'Z'"
            ),
          },
        ]

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfter).to.containSubset(
          _.map(inventoryChanges, inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(inventoryChange.expirationDate),
            quantityOnHand: inventoryChange.resultingQuantityOnHand,
          }))
        )

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .select(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset(
          _.map(inventoryChanges, inventoryChange => ({
            consumableName: inventoryChange.consumableName,
            siteId: geneXpertDevice.siteId,
            consumableReason,
            resultId: null,
            operation: 'add from GxConnect',
            lotNumber: null,
            expiresOn: new Date(inventoryChange.expirationDate),
            quantity: Math.abs(inventoryChange.quantity),
            notes: null,
            adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
            adjustedTo: null,
          }))
        )
      })

      it('should increase the quantity inventory items that do exist', async () => {
        const now = new Date()
        const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .orderBy(['ii.createdOn', 'ii.id'])
          .first(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.isNotEmpty(inventoryItemAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'
        const quantity = 13

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName: inventoryItemAtSiteBefore.consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand:
                      inventoryItemAtSiteBefore.quantityOnHand + quantity,
                    dateChanged: startedOn,
                    expirationDate: inventoryItemAtSiteBefore.expiresOn,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': inventoryItemAtSiteBefore.id })
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfter).to.containSubset([
          {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: inventoryItemAtSiteBefore.expiresOn,
            quantityOnHand: _.max([
              0,
              inventoryItemAtSiteBefore.quantityOnHand + quantity,
            ]),
          },
        ])

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .orderBy('il.id', 'desc')
          .first(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset({
          consumableName: inventoryItemAtSiteBefore.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: inventoryItemAtSiteBefore.expiresOn,
          quantity,
          notes: null,
          adjustedFrom: setMilliseconds(startedOn, 0),
          adjustedTo: null,
        })
      })

      it('should decrease the quantity on hand of existing inventory items', async () => {
        const now = new Date()
        const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .orderBy(['ii.createdOn', 'ii.id'])
          .first(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.isNotEmpty(inventoryItemAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const consumableReason = 'Captured'
        const quantity = -3

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: {
                inventoryChanges: [
                  {
                    consumableName: inventoryItemAtSiteBefore.consumableName,
                    consumableReasonName: consumableReason,
                    quantity,
                    resultingQuantityOnHand:
                      inventoryItemAtSiteBefore.quantityOnHand + quantity,
                    dateChanged: startedOn,
                    expirationDate: inventoryItemAtSiteBefore.expiresOn,
                  },
                ],
              },
            },
          }),
        })

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ 'ii.id': inventoryItemAtSiteBefore.id })
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )

        expect(inventoryItemsAtSiteAfter).to.containSubset([
          {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: inventoryItemAtSiteBefore.expiresOn,
            quantityOnHand: _.max([
              0,
              inventoryItemAtSiteBefore.quantityOnHand + quantity,
            ]),
          },
        ])

        const inventoryLog = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .join('Consumable as c', 'il.consumableId', 'c.id')
          .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
          .orderBy('il.id', 'desc')
          .first(
            'c.name as consumableName',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.operation',
            'il.lotNumber',
            'il.expiresOn',
            'il.quantity',
            'il.notes',
            'il.adjustedFrom',
            'il.adjustedTo'
          )

        expect(inventoryLog).to.containSubset({
          consumableName: inventoryItemAtSiteBefore.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason,
          resultId: null,
          operation: 'remove from GxConnect',
          lotNumber: null,
          expiresOn: inventoryItemAtSiteBefore.expiresOn,
          quantity: Math.abs(quantity),
          notes: null,
          adjustedFrom: setMilliseconds(startedOn, 0),
          adjustedTo: null,
        })
      })
    })

    it('should accept different reasons', async () => {
      const now = new Date()
      const inventoryItemsAtSiteBefore = await knex('InventoryItem')
        .where({ siteId: geneXpertDevice.siteId })
        .pluck('id')

      const startedOn = subDays(now, 1)
      const endedOn = addHours(startedOn, 2)

      const inventoryChanges = [
        {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Captured',
          quantity: 13,
          resultingQuantityOnHand: 73,
          dateChanged: subHours(startedOn, 1),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 5).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'GeneXpert Ebola Cartridge',
          consumableReasonName: 'Captured',
          quantity: -3,
          resultingQuantityOnHand: 18,
          dateChanged: subHours(startedOn, 2),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 6).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'Xpert HIV-1 Qual Cartridge',
          consumableReasonName: 'Transfer Sent',
          quantity: -4,
          resultingQuantityOnHand: 46,
          dateChanged: subHours(startedOn, 3),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 8).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'Xpert HIV-1 Viral Load Cartridge',
          consumableReasonName: 'Transfer Received',
          quantity: 11,
          resultingQuantityOnHand: 24,
          dateChanged: subHours(startedOn, 4),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 3).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'GeneXpert TB Ultra Cartridge',
          consumableReasonName: 'Lost',
          quantity: -6,
          resultingQuantityOnHand: 30,
          dateChanged: subHours(startedOn, 5),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 7).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
        {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Expired',
          quantity: -6,
          resultingQuantityOnHand: 50,
          dateChanged: subHours(startedOn, 6),
          expirationDate: dateFormat(
            new Date(subDays(addYears(now, 1), 2).setHours(0, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
        },
      ]

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: { inventoryChanges },
          },
        }),
      })

      const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ siteId: geneXpertDevice.siteId })
        .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
        .select(
          'ii.id',
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      expect(inventoryItemsAtSiteAfter).to.containSubset(
        _.map(inventoryChanges, inventoryChange => ({
          consumableName: inventoryChange.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: new Date(inventoryChange.expirationDate),
          quantityOnHand: inventoryChange.resultingQuantityOnHand,
        }))
      )

      const inventoryLog = await knex('InventoryLog as il')
        .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
        .join('Consumable as c', 'il.consumableId', 'c.id')
        .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
        .select(
          'c.name as consumableName',
          'il.siteId',
          'cr.name as consumableReason',
          'il.resultId',
          'il.operation',
          'il.lotNumber',
          'il.expiresOn',
          'il.quantity',
          'il.notes',
          'il.adjustedFrom',
          'il.adjustedTo'
        )

      expect(inventoryLog).to.containSubset(
        _.map(inventoryChanges, inventoryChange => ({
          consumableName: inventoryChange.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: inventoryChange.consumableReasonName,
          resultId: null,
          operation:
            inventoryChange.quantity >= 0
              ? 'add from GxConnect'
              : 'remove from GxConnect',
          lotNumber: null,
          expiresOn: new Date(inventoryChange.expirationDate),
          quantity: Math.abs(inventoryChange.quantity),
          notes: null,
          adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
          adjustedTo: null,
        }))
      )
    })

    it('should identify lots based on expiration date and adjust the quantity of the correct lot', async () => {
      const now = new Date()
      const inventoryItemsAtSiteBefore = await knex('InventoryItem')
        .where({ siteId: geneXpertDevice.siteId })
        .pluck('id')

      const startedOn = subDays(now, 5)
      const endedOn = addHours(startedOn, 2)

      const lot1 = {
        consumableName: 'GeneXpert TB Cartridge',
        consumableReasonName: 'Captured',
        quantity: 73,
        resultingQuantityOnHand: 73,
        dateChanged: subHours(startedOn, 2),
        expirationDate: dateFormat(
          new Date(subDays(addYears(now, 1), 21).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        ),
      }
      const lot2 = {
        consumableName: 'GeneXpert TB Cartridge',
        consumableReasonName: 'Captured',
        quantity: 38,
        resultingQuantityOnHand: 38,
        dateChanged: subHours(startedOn, 2),
        expirationDate: dateFormat(
          new Date(subDays(addYears(now, 1), 33).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        ),
      }

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: { inventoryChanges: [lot1, lot2] },
          },
        }),
      })

      const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ siteId: geneXpertDevice.siteId })
        .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
        .select(
          'ii.id',
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      expect(inventoryItemsAtSiteAfter).to.containSubset(
        _.map([lot1, lot2], inventoryChange => ({
          consumableName: inventoryChange.consumableName,
          inTransitFromSiteId: null,
          lotNumber: null,
          expiresOn: new Date(inventoryChange.expirationDate),
          quantityOnHand: inventoryChange.resultingQuantityOnHand,
        }))
      )

      const inventoryLogs = await knex('InventoryLog as il')
        .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
        .join('Consumable as c', 'il.consumableId', 'c.id')
        .whereIn('il.inventoryItemId', _.map(inventoryItemsAtSiteAfter, 'id'))
        .select(
          'il.id',
          'c.name as consumableName',
          'il.siteId',
          'cr.name as consumableReason',
          'il.resultId',
          'il.operation',
          'il.lotNumber',
          'il.expiresOn',
          'il.quantity',
          'il.notes',
          'il.adjustedFrom',
          'il.adjustedTo'
        )

      expect(inventoryLogs).to.containSubset(
        _.map([lot1, lot2], inventoryChange => ({
          consumableName: inventoryChange.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: inventoryChange.consumableReasonName,
          resultId: null,
          operation:
            inventoryChange.quantity >= 0
              ? 'add from GxConnect'
              : 'remove from GxConnect',
          lotNumber: null,
          expiresOn: new Date(inventoryChange.expirationDate),
          quantity: Math.abs(inventoryChange.quantity),
          notes: null,
          adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
          adjustedTo: null,
        }))
      )

      const updateToLot1 = _.assign({}, lot1, {
        consumableReasonName: 'Stolen',
        quantity: -3,
        resultingQuantityOnHand: 70,
        dateChanged: subHours(startedOn, 1),
      })

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: { inventoryChanges: [updateToLot1] },
          },
        }),
      })

      const lot1InventoryItem = _.find(inventoryItemsAtSiteAfter, {
        expiresOn: new Date(lot1.expirationDate),
      })
      const lot2InventoryItem = _.find(inventoryItemsAtSiteAfter, {
        expiresOn: new Date(lot2.expirationDate),
      })
      const lot1InventoryItemAfterAdjustment1 = await knex(
        'InventoryItem as ii'
      )
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ 'ii.id': lot1InventoryItem.id })
        .first(
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      const lot2InventoryItemAfterAdjustment1 = await knex(
        'InventoryItem as ii'
      )
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ 'ii.id': lot2InventoryItem.id })
        .first(
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      assert.deepEqual(lot1InventoryItemAfterAdjustment1, {
        consumableName: lot1.consumableName,
        inTransitFromSiteId: null,
        lotNumber: null,
        expiresOn: new Date(lot1.expirationDate),
        quantityOnHand: _.max([
          0,
          lot1InventoryItem.quantityOnHand + updateToLot1.quantity,
        ]),
      })
      assert.deepEqual(lot2InventoryItemAfterAdjustment1, {
        consumableName: lot2.consumableName,
        inTransitFromSiteId: null,
        lotNumber: null,
        expiresOn: new Date(lot2.expirationDate),
        quantityOnHand: lot2.resultingQuantityOnHand,
      })

      const updateToLot2 = _.assign({}, lot2, {
        consumableReasonName: 'Transfer Received',
        quantity: 100,
        resultingQuantityOnHand: 138,
        dateChanged: subHours(startedOn, 1),
      })

      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, basicDevicePayload, {
          name: deviceName,
          operation: {
            startedOn,
            endedOn,
            data: { inventoryChanges: [updateToLot2] },
          },
        }),
      })

      const lot1InventoryItemAfterAdjustment2 = await knex(
        'InventoryItem as ii'
      )
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ 'ii.id': lot1InventoryItem.id })
        .first(
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      const lot2InventoryItemAfterAdjustment2 = await knex(
        'InventoryItem as ii'
      )
        .join('Consumable as c', 'ii.consumableId', 'c.id')
        .where({ 'ii.id': lot2InventoryItem.id })
        .first(
          'c.name as consumableName',
          'ii.inTransitFromSiteId',
          'ii.lotNumber',
          'ii.expiresOn',
          'ii.quantityOnHand'
        )
      assert.deepEqual(lot1InventoryItemAfterAdjustment2, {
        consumableName: lot1.consumableName,
        inTransitFromSiteId: null,
        lotNumber: null,
        expiresOn: new Date(lot1.expirationDate),
        quantityOnHand: _.max([
          0,
          lot1InventoryItem.quantityOnHand + updateToLot1.quantity,
        ]),
      })
      assert.deepEqual(lot2InventoryItemAfterAdjustment2, {
        consumableName: lot2.consumableName,
        inTransitFromSiteId: null,
        lotNumber: null,
        expiresOn: new Date(lot2.expirationDate),
        quantityOnHand: _.max([
          0,
          lot2InventoryItem.quantityOnHand + updateToLot2.quantity,
        ]),
      })
      const inventoryLogsForLot1And2 = await knex('InventoryLog as il')
        .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
        .join('Consumable as c', 'il.consumableId', 'c.id')
        .whereIn('il.inventoryItemId', [
          lot1InventoryItem.id,
          lot2InventoryItem.id,
        ])
        .orderBy('il.id')
        .select(
          'c.name as consumableName',
          'il.siteId',
          'cr.name as consumableReason',
          'il.resultId',
          'il.operation',
          'il.lotNumber',
          'il.expiresOn',
          'il.quantity',
          'il.notes',
          'il.adjustedFrom',
          'il.adjustedTo'
        )
      expect(inventoryLogsForLot1And2).to.containSubset([
        {
          consumableName: lot1.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: lot1.consumableReasonName,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: new Date(lot1.expirationDate),
          quantity: Math.abs(lot1.resultingQuantityOnHand),
          notes: null,
          adjustedFrom: setMilliseconds(lot1.dateChanged, 0),
          adjustedTo: null,
        },
        {
          consumableName: lot2.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: lot2.consumableReasonName,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: new Date(lot2.expirationDate),
          quantity: Math.abs(lot2.resultingQuantityOnHand),
          notes: null,
          adjustedFrom: setMilliseconds(lot2.dateChanged, 0),
          adjustedTo: null,
        },
        {
          consumableName: lot1.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: updateToLot1.consumableReasonName,
          resultId: null,
          operation: 'remove from GxConnect',
          lotNumber: null,
          expiresOn: new Date(lot1.expirationDate),
          quantity: Math.abs(updateToLot1.quantity),
          notes: null,
          adjustedFrom: setMilliseconds(updateToLot1.dateChanged, 0),
          adjustedTo: null,
        },
        {
          consumableName: lot2.consumableName,
          siteId: geneXpertDevice.siteId,
          consumableReason: updateToLot2.consumableReasonName,
          resultId: null,
          operation: 'add from GxConnect',
          lotNumber: null,
          expiresOn: new Date(lot2.expirationDate),
          quantity: Math.abs(updateToLot2.quantity),
          notes: null,
          adjustedFrom: setMilliseconds(updateToLot2.dateChanged, 0),
          adjustedTo: null,
        },
      ])
    })

    describe('when quantity on hand is explicitly specified in the data', () => {
      it('should overwrite the quantity on hand in the inventory record', async () => {
        const now = new Date()
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .pluck('id')

        const startedOn = subDays(now, 7)
        const endedOn = addHours(startedOn, 2)
        const expirationDate = dateFormat(
          new Date(subDays(addYears(now, 1), 15).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )

        const initialLotCaptured = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Captured',
          quantity: 25,
          resultingQuantityOnHand: 25,
          dateChanged: subHours(startedOn, 2),
          expirationDate,
        }

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [initialLotCaptured] },
            },
          }),
        })

        const inventoryItemsAtSiteAfterCapture = await knex(
          'InventoryItem as ii'
        )
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfterCapture).to.containSubset([
          {
            consumableName: initialLotCaptured.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(initialLotCaptured.expirationDate),
            quantityOnHand: initialLotCaptured.resultingQuantityOnHand,
          },
        ])

        const inventoryLost = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Lost',
          quantity: -5,
          resultingQuantityOnHand: 999,
          dateChanged: subHours(startedOn, 1),
          expirationDate,
        }

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [inventoryLost] },
            },
          }),
        })

        const inventoryItemsAtSiteAfterLoss = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfterLoss).to.containSubset([
          {
            consumableName: inventoryLost.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(inventoryLost.expirationDate),
            quantityOnHand: inventoryLost.resultingQuantityOnHand,
          },
        ])
      })
    })

    describe('when quantity on hand is not specified in the data', () => {
      it('should calculate the quantity on hand in the inventory record', async () => {
        const now = new Date()
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: geneXpertDevice.siteId })
          .pluck('id')

        const startedOn = subDays(now, 9)
        const endedOn = addHours(startedOn, 2)
        const expirationDate = dateFormat(
          new Date(subDays(addYears(now, 1), 15).setHours(0, 0, 0, 0)),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )

        const initialLotCaptured = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Captured',
          quantity: 25,
          dateChanged: subHours(startedOn, 2),
          expirationDate,
        }

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [initialLotCaptured] },
            },
          }),
        })

        const inventoryItemsAtSiteAfterCapture = await knex(
          'InventoryItem as ii'
        )
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfterCapture).to.containSubset([
          {
            consumableName: initialLotCaptured.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(initialLotCaptured.expirationDate),
            quantityOnHand: initialLotCaptured.quantity,
          },
        ])

        const inventoryLost = {
          consumableName: 'GeneXpert TB Cartridge',
          consumableReasonName: 'Lost',
          quantity: -5,
          dateChanged: subHours(startedOn, 1),
          expirationDate,
        }

        await postToDeviceApi({
          authHeader: deviceAuth,
          payload: _.merge({}, basicDevicePayload, {
            name: deviceName,
            operation: {
              startedOn,
              endedOn,
              data: { inventoryChanges: [inventoryLost] },
            },
          }),
        })

        const inventoryItemsAtSiteAfterLoss = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: geneXpertDevice.siteId })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        expect(inventoryItemsAtSiteAfterLoss).to.containSubset([
          {
            consumableName: inventoryLost.consumableName,
            inTransitFromSiteId: null,
            lotNumber: null,
            expiresOn: new Date(inventoryLost.expirationDate),
            quantityOnHand: _.max([
              0,
              initialLotCaptured.quantity + inventoryLost.quantity,
            ]),
          },
        ])
      })
    })
  })
})
