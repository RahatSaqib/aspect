const _ = require('lodash')

const chai = require('chai')
const chaiSubset = require('chai-subset')
const addYears = require('date-fns/addYears')
const subDays = require('date-fns/subDays')
const addHours = require('date-fns/addHours')
const subHours = require('date-fns/subHours')
const subMinutes = require('date-fns/subMinutes')
const setMilliseconds = require('date-fns/setMilliseconds')
const dateFormat = require('date-fns/format')
const { createGxConnectTestContext } = require('./gxconnect_utils')
const { getLastResultId } = require('../utils')
const { basicResultPayload } = require('./geneXpertConstants')

const { knex } = require('../../../src/db')
const { waitForApproximately } = require('../../utils/generatorFunctionUtils')

const { deviceTypeToId } = require('../../../src/shared/dictionary')
const { getLocalDateInUtc } = require('../../../src/shared/date')

const server = require('../../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('Device API routes for GxConnect Devices', () => {
  const macAddress = 'MAC00000000FAKE'
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const deviceName = 'New GeneXpert Laboratory'
  const deviceSerialNumber = 'Cepheid-PC-BLH'

  describe('results', () => {
    const context = createGxConnectTestContext(server, {
      countryCode,
      adminUsername,
      adminPassword,
      deviceName,
      macAddress,
      deviceSerialNumber,
    })
    beforeEach(context.beforeRegisterAndSetDevice)
    const { getLastResult } = context
    afterEach(context.afterCleanUp)

    describe('when the assay in the result payload is mapped to a consumable', () => {
      const initialQuantityOnHand = 100

      it('should reduce inventory levels of that consumable appropriately', async () => {
        const { basicDevicePayload, deviceAuth, device, site, now } = context

        const consumableAssay = await knex('ConsumableAssay as ca')
          .join('Assay as a', 'ca.assayId', 'a.id')
          .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
          .where({ 'dt.externalId': basicDevicePayload.type.id })
          .andWhere('ca.quantity', '>', 0)
          .first('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

        assert.isNotEmpty(consumableAssay)
        assert.isAbove(consumableAssay.quantity, 0)

        const expiryDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))
        const [inventoryItemId] = await knex('InventoryItem').insert({
          consumableId: consumableAssay.consumableId,
          siteId: site.id,
          expiresOn: expiryDate,
          quantityOnHand: initialQuantityOnHand,
          createdOn: subDays(now, 4),
          updatedOn: subDays(now, 4),
        })

        const testStartedOn = setMilliseconds(subDays(context.now, 3), 0)
        const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, _.assign({}, basicDevicePayload, basicResultPayload), {
              result: _.assign({}, basicResultPayload.result, {
                id: dateFormat(new Date(), 'T'),
                startedOn: testStartedOn,
                endedOn: testEndedOn,
                sample: { id: 'Existing Sample' },
                instrument: { serial: 'Existing Instrument' },
                assay: {
                  id: consumableAssay.assayId,
                  version: '2',
                },
              }),
            })
          )
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const lastResultId = await getLastResultId(knex, device.id)
        const inventoryItem = await knex('InventoryItem')
          .where({ id: inventoryItemId })
          .first()
        assert.equal(
          inventoryItem.quantityOnHand,
          _.max([0, initialQuantityOnHand - consumableAssay.quantity])
        )

        const inventoryLogs = await knex('InventoryLog as il')
          .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
          .where({ inventoryItemId })
          .select(
            'il.consumableId',
            'il.siteId',
            'cr.name as consumableReason',
            'il.resultId',
            'il.quantity'
          )
        assert.deepEqual(inventoryLogs, [
          {
            consumableId: inventoryItem.consumableId,
            siteId: site.id,
            consumableReason: 'Test Conducted',
            resultId: lastResultId,
            quantity: consumableAssay.quantity,
          },
        ])
      })

      describe('when the test already exists in the database', () => {
        it('should NOT reduce inventory levels of the consumable', async () => {
          const { basicDevicePayload, deviceAuth, site, now } = context
          const uniqueTestId = dateFormat(new Date(), 'T')

          const consumableAssays = await knex('ConsumableAssay as ca')
            .join('Assay as a', 'ca.assayId', 'a.id')
            .join('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
            .where({ 'dt.externalId': basicDevicePayload.type.id })
            .andWhere('ca.quantity', '>', 0)
            .select('ca.consumableId', 'ca.quantity', 'a.externalId as assayId')

          assert.isNotEmpty(consumableAssays)
          const [consumableAssay] = consumableAssays
          assert.isAbove(consumableAssay.quantity, 0)

          const expiryDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))
          const [inventoryItemId] = await knex('InventoryItem').insert({
            consumableId: consumableAssay.consumableId,
            siteId: site.id,
            expiresOn: expiryDate,
            quantityOnHand: initialQuantityOnHand,
            createdOn: subDays(now, 4),
            updatedOn: subDays(now, 4),
          })

          const inventoryItemBeforeFirstRequest = await knex('InventoryItem')
            .where({
              consumableId: consumableAssay.consumableId,
              siteId: site.id,
              expiresOn: getLocalDateInUtc(expiryDate),
            })
            .first()

          const testStartedOn = setMilliseconds(
            subMinutes(
              subHours(now, Math.floor(Math.random() * 24)),
              Math.floor(Math.random() * 60)
            ),
            0
          )
          const testEndedOn = setMilliseconds(addHours(testStartedOn, 2), 0)
          const sampleId = 'GxConnect test reduces inventory'
          const instrumentSerial = 'Cepheid PC serial'

          // Send first test
          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign(
                {},
                _.assign({}, basicDevicePayload, basicResultPayload),
                {
                  result: _.assign({}, basicResultPayload.result, {
                    id: uniqueTestId,
                    assay: {
                      id: consumableAssay.assayId,
                      version: '2',
                    },
                    sample: { id: sampleId },
                    instrument: { serial: instrumentSerial },
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                  }),
                }
              )
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const beforeUpdateResultDetails = await getLastResult()

          const inventoryLogsAfterFirstRequest = await knex(
            'InventoryLog as il'
          )
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where({ inventoryItemId })
            .select(
              'il.consumableId',
              'il.siteId',
              'cr.name as consumableReason',
              'il.resultId',
              'il.quantity'
            )

          const inventoryItemAfterFirstRequest = await knex('InventoryItem')
            .where({
              consumableId: consumableAssay.consumableId,
              siteId: site.id,
              expiresOn: getLocalDateInUtc(expiryDate),
            })
            .first()

          assert.equal(
            inventoryItemAfterFirstRequest.quantityOnHand,
            _.max([
              0,
              inventoryItemBeforeFirstRequest.quantityOnHand -
                consumableAssay.quantity,
            ])
          )

          await waitForApproximately(2, 'seconds')

          // Send second request for same test
          const newResultData = {
            customFieldData: {
              1: {
                notAvailable: false,
                label: 'HIV Status',
                value: 'Positive',
              },
              2: {
                notAvailable: false,
                label: 'Visual Analysis',
                value: 'Blood Stained',
              },
            },
          }
          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign(
                {},
                _.assign({}, basicDevicePayload, basicResultPayload),
                {
                  result: _.assign({}, basicResultPayload.result, {
                    id: uniqueTestId,
                    assay: {
                      id: consumableAssay.assayId,
                      version: '2',
                    },
                    sample: { id: sampleId },
                    instrument: { serial: instrumentSerial },
                    startedOn: testStartedOn,
                    endedOn: testEndedOn,
                    data: newResultData,
                  }),
                }
              )
            )
            .then(res => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const afterUpdateResultDetails = await getLastResult()

          assert.equal(
            afterUpdateResultDetails.id,
            beforeUpdateResultDetails.id
          )
          assert.equal(
            afterUpdateResultDetails.createdOn.toString(),
            beforeUpdateResultDetails.createdOn.toString()
          )
          expect(afterUpdateResultDetails.updatedOn).to.be.above(
            beforeUpdateResultDetails.updatedOn
          )

          const inventoryItemAfterSecondRequest = await knex('InventoryItem')
            .where({
              consumableId: consumableAssay.consumableId,
              siteId: site.id,
              expiresOn: getLocalDateInUtc(expiryDate),
            })
            .first()

          assert.deepEqual(
            inventoryItemAfterSecondRequest,
            inventoryItemAfterFirstRequest
          )

          const inventoryLogsAfterSecondRequest = await knex(
            'InventoryLog as il'
          )
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .where({ inventoryItemId })
            .select(
              'il.consumableId',
              'il.siteId',
              'cr.name as consumableReason',
              'il.resultId',
              'il.quantity'
            )
          assert.deepEqual(
            inventoryLogsAfterSecondRequest,
            inventoryLogsAfterFirstRequest
          )

          const matchingConsumableAssayAfterSecondRequest = _.find(
            consumableAssays,
            {
              consumableId: _.head(inventoryLogsAfterSecondRequest)
                .consumableId,
              quantity: _.head(inventoryLogsAfterSecondRequest).quantity,
            }
          )
          assert.isNotEmpty(matchingConsumableAssayAfterSecondRequest)
        })
      })
    })
  })

  describe('inventory changes', () => {
    const context = createGxConnectTestContext(server, {
      countryCode,
      adminUsername,
      adminPassword,
      deviceName,
      macAddress,
      deviceSerialNumber,
    })
    beforeEach(context.beforeRegisterAndSetDevice)
    const { runTest } = context
    afterEach(context.afterCleanUp)

    it('should create inventory items that do not exist', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context
        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: site.id })
          .select()
        assert.isEmpty(inventoryItemsAtSiteBefore)

        const startedOn = subHours(subDays(now, 1), 2)
        const endedOn = subHours(now, 2)
        const expirationDate = dateFormat(
          addYears(now, 1).setHours(0, 0, 0, 0),
          "yyyy-MM-dd'T'HH:mm:ss'Z'"
        )
        const consumableName = 'Xpert HIV-1 Qual Cartridge'
        const consumableReason = 'Captured'
        const initialQuantity = 100
        const quantity = 5

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
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
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: site.id })
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.deepEqual(
          _.map(inventoryItemsAtSiteAfter, inventoryItem =>
            _.omit(inventoryItem, 'id')
          ),
          [
            {
              consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: new Date(expirationDate),
              quantityOnHand: _.max([0, initialQuantity + quantity]),
            },
          ]
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

        assert.deepEqual(inventoryLog, [
          {
            consumableName,
            siteId: site.id,
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
      }))

    describe('inventory update', () => {
      const initialQuantityOnHand = 100
      beforeEach(() =>
        run(async knex => {
          const {
            basicDevicePayload,
            site: { id: siteId },
          } = context
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
            siteId,
            expiresOn: expiryDate,
            quantityOnHand: initialQuantityOnHand,
          })
        })
      )
      it('should ignore changes for consumables that are unknown', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context
          const inventoryItemsAtSiteBefore = await knex('InventoryItem')
            .where({ siteId: site.id })
            .select()

          const startedOn = subHours(subDays(now, 1), 2)
          const endedOn = subHours(now, 2)
          const expirationDate = new Date(addYears(now, 1).setHours(0, 0, 0, 0))

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
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
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfter = await knex('InventoryItem')
            .where({ siteId: site.id })
            .select()
          assert.deepEqual(
            inventoryItemsAtSiteBefore,
            inventoryItemsAtSiteAfter
          )
        }))

      it('should accept all types of GeneXpert cartridges', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context

          const inventoryItemsAtSiteBefore = await knex('InventoryItem')
            .where({ siteId: site.id })
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

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfter, inventoryItem =>
                _.omit(inventoryItem, 'id')
              ),
              'consumableName'
            ),
            _.sortBy(
              _.map(inventoryChanges, inventoryChange => ({
                consumableName: inventoryChange.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: new Date(inventoryChange.expirationDate),
                quantityOnHand: inventoryChange.resultingQuantityOnHand,
              })),
              'consumableName'
            )
          )

          const inventoryLog = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .join('Consumable as c', 'il.consumableId', 'c.id')
            .whereIn(
              'il.inventoryItemId',
              _.map(inventoryItemsAtSiteAfter, 'id')
            )
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

          assert.deepEqual(
            _.sortBy(inventoryLog, ['consumableName', 'consumableReason']),
            _.sortBy(
              _.map(inventoryChanges, inventoryChange => ({
                consumableName: inventoryChange.consumableName,
                siteId: site.id,
                consumableReason,
                resultId: null,
                operation: 'add from GxConnect',
                lotNumber: null,
                expiresOn: new Date(inventoryChange.expirationDate),
                quantity: Math.abs(inventoryChange.quantity),
                notes: null,
                adjustedFrom: setMilliseconds(inventoryChange.dateChanged, 0),
                adjustedTo: null,
              })),
              ['consumableName', 'consumableReason']
            )
          )
        }))

      it('should increase the quantity inventory items that do exist', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context
          const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
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

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: {
                    inventoryChanges: [
                      {
                        consumableName:
                          inventoryItemAtSiteBefore.consumableName,
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
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

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
          assert.deepEqual(
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            [
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
            ]
          )

          const inventoryLog = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .join('Consumable as c', 'il.consumableId', 'c.id')
            .whereIn(
              'il.inventoryItemId',
              _.map(inventoryItemsAtSiteAfter, 'id')
            )
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

          assert.deepEqual(inventoryLog, {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            siteId: site.id,
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
        }))

      it('should decrease the quantity on hand of existing inventory items', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context
          const inventoryItemAtSiteBefore = await knex('InventoryItem as ii')
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
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

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: {
                    inventoryChanges: [
                      {
                        consumableName:
                          inventoryItemAtSiteBefore.consumableName,
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
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

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

          assert.deepEqual(
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            [
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
            ]
          )

          const inventoryLog = await knex('InventoryLog as il')
            .join('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
            .join('Consumable as c', 'il.consumableId', 'c.id')
            .whereIn(
              'il.inventoryItemId',
              _.map(inventoryItemsAtSiteAfter, 'id')
            )
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

          assert.deepEqual(inventoryLog, {
            consumableName: inventoryItemAtSiteBefore.consumableName,
            siteId: site.id,
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
        }))
    })

    it('should accept different reasons', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: site.id })
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

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges },
              },
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: site.id })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.deepEqual(
          _.sortBy(
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            ['consumableName', 'consumableReason', 'expiresOn']
          ),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: new Date(inventoryChange.expirationDate),
              quantityOnHand: inventoryChange.resultingQuantityOnHand,
            })),
            ['consumableName', 'consumableReason', 'expiresOn']
          )
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

        assert.deepEqual(
          _.sortBy(inventoryLog, [
            'consumableName',
            'consumableReason',
            'expiresOn',
          ]),
          _.sortBy(
            _.map(inventoryChanges, inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              siteId: site.id,
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
            })),
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )
      }))

    it('should identify lots based on expiration date and adjust the quantity of the correct lot', () =>
      runTest(async knex => {
        const { basicDevicePayload, deviceAuth, site, now } = context

        const inventoryItemsAtSiteBefore = await knex('InventoryItem')
          .where({ siteId: site.id })
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

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [lot1, lot2] },
              },
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

        const inventoryItemsAtSiteAfter = await knex('InventoryItem as ii')
          .join('Consumable as c', 'ii.consumableId', 'c.id')
          .where({ siteId: site.id })
          .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
          .select(
            'ii.id',
            'c.name as consumableName',
            'ii.inTransitFromSiteId',
            'ii.lotNumber',
            'ii.expiresOn',
            'ii.quantityOnHand'
          )
        assert.deepEqual(
          _.sortBy(
            _.map(inventoryItemsAtSiteAfter, inventoryItem =>
              _.omit(inventoryItem, 'id')
            ),
            'expiresOn'
          ),
          _.sortBy(
            _.map([lot1, lot2], inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              inTransitFromSiteId: null,
              lotNumber: null,
              expiresOn: new Date(inventoryChange.expirationDate),
              quantityOnHand: inventoryChange.resultingQuantityOnHand,
            })),
            'expiresOn'
          )
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

        assert.deepEqual(
          _.sortBy(
            _.map(inventoryLogs, inventoryLog => _.omit(inventoryLog, 'id')),
            ['consumableName', 'consumableReason', 'expiresOn']
          ),
          _.sortBy(
            _.map([lot1, lot2], inventoryChange => ({
              consumableName: inventoryChange.consumableName,
              siteId: site.id,
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
            })),
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )

        const updateToLot1 = _.assign({}, lot1, {
          consumableReasonName: 'Stolen',
          quantity: -3,
          resultingQuantityOnHand: 70,
          dateChanged: subHours(startedOn, 1),
        })

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [updateToLot1] },
              },
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

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

        await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send(
            _.assign({}, basicDevicePayload, {
              operation: {
                startedOn,
                endedOn,
                data: { inventoryChanges: [updateToLot2] },
              },
            })
          )
          .then(res => {
            assert.equal(res.status, 200, res.text)
            assert.typeOf(res.body, 'Object')
          })
          .catch(assert.fail)

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
        assert.deepEqual(
          _.sortBy(inventoryLogsForLot1And2, [
            'consumableName',
            'consumableReason',
            'expiresOn',
          ]),
          _.sortBy(
            [
              {
                consumableName: lot1.consumableName,
                siteId: site.id,
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
                siteId: site.id,
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
                siteId: site.id,
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
                siteId: site.id,
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
            ],
            ['consumableName', 'consumableReason', 'expiresOn']
          )
        )
      }))

    describe('when quantity on hand is explicitly specified in the data', () => {
      it('should overwrite the quantity on hand in the inventory record', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context

          const inventoryItemsAtSiteBefore = await knex('InventoryItem')
            .where({ siteId: site.id })
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

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges: [initialLotCaptured] },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfterCapture = await knex(
            'InventoryItem as ii'
          )
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfterCapture, inventoryItem =>
                _.omit(inventoryItem, 'id')
              ),
              'expiresOn'
            ),
            [
              {
                consumableName: initialLotCaptured.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: new Date(initialLotCaptured.expirationDate),
                quantityOnHand: initialLotCaptured.resultingQuantityOnHand,
              },
            ]
          )

          const inventoryLost = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Lost',
            quantity: -5,
            resultingQuantityOnHand: 999,
            dateChanged: subHours(startedOn, 1),
            expirationDate,
          }

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges: [inventoryLost] },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfterLoss = await knex(
            'InventoryItem as ii'
          )
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfterLoss, inventoryItem =>
                _.omit(inventoryItem, 'id')
              ),
              'expiresOn'
            ),
            [
              {
                consumableName: inventoryLost.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: new Date(inventoryLost.expirationDate),
                quantityOnHand: inventoryLost.resultingQuantityOnHand,
              },
            ]
          )
        }))
    })

    describe('when quantity on hand is not specified in the data', () => {
      it('should calculate the quantity on hand in the inventory record', () =>
        runTest(async knex => {
          const { basicDevicePayload, deviceAuth, site, now } = context

          const inventoryItemsAtSiteBefore = await knex('InventoryItem')
            .where({ siteId: site.id })
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

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges: [initialLotCaptured] },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfterCapture = await knex(
            'InventoryItem as ii'
          )
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfterCapture, inventoryItem =>
                _.omit(inventoryItem, 'id')
              ),
              'expiresOn'
            ),
            [
              {
                consumableName: initialLotCaptured.consumableName,
                inTransitFromSiteId: null,
                lotNumber: null,
                expiresOn: new Date(initialLotCaptured.expirationDate),
                quantityOnHand: initialLotCaptured.quantity,
              },
            ]
          )

          const inventoryLost = {
            consumableName: 'GeneXpert TB Cartridge',
            consumableReasonName: 'Lost',
            quantity: -5,
            dateChanged: subHours(startedOn, 1),
            expirationDate,
          }

          await server
            .post('/device')
            .set('Authorization', deviceAuth)
            .send(
              _.assign({}, basicDevicePayload, {
                operation: {
                  startedOn,
                  endedOn,
                  data: { inventoryChanges: [inventoryLost] },
                },
              })
            )
            .then(res => {
              assert.equal(res.status, 200, res.text)
              assert.typeOf(res.body, 'Object')
            })
            .catch(assert.fail)

          const inventoryItemsAtSiteAfterLoss = await knex(
            'InventoryItem as ii'
          )
            .join('Consumable as c', 'ii.consumableId', 'c.id')
            .where({ siteId: site.id })
            .whereNotIn('ii.id', inventoryItemsAtSiteBefore)
            .select(
              'ii.id',
              'c.name as consumableName',
              'ii.inTransitFromSiteId',
              'ii.lotNumber',
              'ii.expiresOn',
              'ii.quantityOnHand'
            )
          assert.deepEqual(
            _.sortBy(
              _.map(inventoryItemsAtSiteAfterLoss, inventoryItem =>
                _.omit(inventoryItem, 'id')
              ),
              'expiresOn'
            ),
            [
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
            ]
          )
        }))
    })
  })
  describe('Daily details', () => {
    describe('whole country same settings', () => {
      const context = createGxConnectTestContext(server, {
        countryCode,
        adminUsername,
        adminPassword,
        deviceName,
        macAddress,
      })
      let insertedConfiguration = null
      beforeEach(async () => {
        await context.beforeRegisterAndSetDevice()
        const { partnerId } = context.device
        const { geographyId } = await knex('Site as s')
          .where({ externalId: 'Ohio_Wayne' })
          .first('s.geographyId')
        ;[insertedConfiguration] = await knex('DeviceConfiguration').insert({
          deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
          geographyId,
          partnerId,
          data: JSON.stringify({
            EnableInventoryModule: true,
            AspectUploadExcludePatientId: true,
            GxAlertUploadExcludePatientId: true,
          }),
          updatedOn: new Date(),
        })
      })
      afterEach(async () => {
        await context.afterCleanUp()
        await knex('DeviceConfiguration')
          .where({ id: insertedConfiguration })
          .delete()
      })

      it('should receive deviceConfiguration for the whole country', async () => {
        const { deviceAuth, basicDevicePayload } = context
        let res = await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send({ includeDeviceConfiguration: true, ...basicDevicePayload })
          .catch(assert.fail)

        assert.equal(res.statusCode, 200)
        assert.deepEqual(res.body.deviceConfiguration, {
          EnableInventoryModule: false,
          AspectUploadExcludePatientId: false,
          GxAlertUploadExcludePatientId: false,
        })
        // the second time, device configuration it will be null because was already responded

        res = await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send({ includeDeviceConfiguration: true, ...basicDevicePayload })
          .catch(assert.fail)

        assert.equal(res.statusCode, 200)
        assert.isNull(res.body.deviceConfiguration)
      })
    })
    describe('different configurations depending the state', () => {
      const context = createGxConnectTestContext(server, {
        countryCode,
        adminUsername,
        adminPassword,
        deviceName: 'Dayton Ohio 2',
        macAddress,
      })
      let insertedConfiguration = null
      beforeEach(async () => {
        const siteOhio = await knex('Site as s')
          .where({ externalId: 'OH_Dayton' })
          .first()
        await knex('Site').insert({
          ..._.omit(siteOhio, ['name', 'id', 'externalId']),
          name: 'Dayton Ohio 2',
          externalId: 'OH_Dayton_2',
        })
        await context.beforeRegisterAndSetDevice()
        const { partnerId } = context.device

        ;[insertedConfiguration] = await knex('DeviceConfiguration').insert({
          deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
          geographyId: siteOhio.geographyId,
          partnerId,
          data: JSON.stringify({
            EnableInventoryModule: true,
            AspectUploadExcludePatientId: true,
            GxAlertUploadExcludePatientId: true,
          }),
          updatedOn: new Date(),
        })
      })
      afterEach(async () => {
        await context.afterCleanUp()
        await knex('DeviceConfiguration')
          .where({ id: insertedConfiguration })
          .delete()
      })
      it('should receive deviceConfiguration for that specific state', async () => {
        const { deviceAuth, basicDevicePayload } = context
        const res = await server
          .post('/device')
          .set('Authorization', deviceAuth)
          .send({ includeDeviceConfiguration: true, ...basicDevicePayload })
          .catch(assert.fail)

        assert.equal(res.statusCode, 200)
        assert.deepEqual(res.body.deviceConfiguration, {
          EnableInventoryModule: true,
          AspectUploadExcludePatientId: true,
          GxAlertUploadExcludePatientId: true,
        })
      })
    })
  })
})
