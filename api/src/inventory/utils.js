const _ = require('lodash')
const Boom = require('@hapi/boom')

const { getUser } = require('../auth/service')
const { getPartnerPluginName, getDeviceTypePluginName } = require('../plugin/utils')
const defaultInventoryStrategy = require('./strategies')

const { knex, transact } = require('../db')
const { getSite } = require('../site/service')
const { getConstraints } = require('../auth/constraints')
// const { parseDateOrDefault } = require('../shared/date')
const { selectAssayConsumables } = require('../consumable/assayConsumableService')
const { findConsumableReason } = require('../consumable/consumableService')
const { resolveIssues, escalateIssues } = require('../issue/actions')
const { inventoryStockout, inventoryStockExpiring } = require('./actions')
const { auditInventoryStockout, auditInventoryStockExpiring } = require('../shared/utilsInventory')

const {
  findInventoryItem,
  getInventoryItem,
  //
  updateInventoryItem,
  insertInventoryItem,
  logInventoryChange,
  getConsumableStrategy,
} = require('./common/db')

/**
 * use singleton for inventory strategy instance - cache it in a single instance
 * by key consisted of `partnerId` and `deviceId`
 */
const cachedInventoryStrategies = {}
async function getInventoryStrategy({ partnerId, deviceId }) {
  const inventoryStrategyKey = `partnerId-${partnerId || 0}_deviceId-${deviceId || 0}`
  let inventoryStrategy = cachedInventoryStrategies[inventoryStrategyKey]
  if (!inventoryStrategy) {
    const partnerPluginName = await getPartnerPluginName({ partnerId })
    const deviceTypePluginName = await getDeviceTypePluginName(deviceId)
    const { loadPlugin } = require('../plugin/registration')
    const specificInventoryStrategy = await loadPlugin([partnerPluginName, deviceTypePluginName], 'inventoryStrategy')
    cachedInventoryStrategies[inventoryStrategyKey] = {
      /**
       * first add all exported items for default strategy...
       */
      ...defaultInventoryStrategy,
      /**
       * ...and then overwrite those which are defined in
       * partner or deviceType specific strategy
       */
      ...specificInventoryStrategy,
    }
    inventoryStrategy = cachedInventoryStrategies[inventoryStrategyKey]
  }

  return inventoryStrategy
}

// ----------------------------------------------------------------------------------
async function getInventoryStrategyByAuth(auth) {
  const { partnerId } = await getUser(auth.credentials.name)
  return getInventoryStrategy({ partnerId })
}

// ----------------------------------------------------------------------------------
async function upsertInventoryItem({
  knex,
  inventoryItemId,
  consumableId,
  siteId,
  lotNumber,
  expiresOn,
  // quantity,
  quantityOnHand,
  now,
  userId,
  inTransitFromSiteId,
}) {
  // let inventoryItemId = -1
  if (!inventoryItemId) {
    // !inventoryItem || _.isEmpty(inventoryItem)) {
    ;[inventoryItemId] = await insertInventoryItem(knex, {
      consumableId,
      inTransitFromSiteId: inTransitFromSiteId || null,
      siteId,
      lotNumber,
      expiresOn,
      quantityOnHand,
      // : _.isUndefined(quantityOnHand) ? quantity : quantityOnHand,
      updatedOn: now,
      updatedBy: userId,
      createdOn: now,
      createdBy: userId,
    })
  } else {
    await updateInventoryItem(knex, inventoryItemId, {
      expiresOn,
      lotNumber,
      siteId,
      quantityOnHand,
      // : _.isUndefined(quantityOnHand) ? knex.raw(`quantityOnHand + (${quantity})`) : quantityOnHand,
      updatedOn: now,
      updatedBy: userId,
    })
  }
  return inventoryItemId
}

// ----------------------------------------------------------------------------------
async function getActualInventoryItem(
  inventoryStrategy,
  { siteId, consumableId, expiresOn, lotNumber, fromSiteId },
  operation,
  quantity
) {
  const currentInventoryItem = await findInventoryItem(siteId, consumableId, expiresOn, lotNumber, fromSiteId)
  const actualInventoryItemProps = await inventoryStrategy.getNewQuantityOnHand(
    currentInventoryItem,
    operation,
    quantity
  )
  const { quantityOnHand, inventoryItem: actualInventoryItem } = actualInventoryItemProps
  // if (currentInventoryItem.id !== actualInventoryItem.id) {
  //   ;({ siteId } = actualInventoryItem)
  // }
  return { quantityOnHand, actualInventoryItem }
}

// ----------------------------------------------------------------------------------
async function changeInventoryQuantity(
  inventoryStrategy,
  {
    consumableId,
    siteId,
    lotNumber,
    expiresOn,
    quantity,
    operation,
    now,
    userId,
    logProps,
    // for getting messageContext
    plugins,
    messageContext,
  }
) {
  const { quantityOnHand, actualInventoryItem } = await getActualInventoryItem(
    inventoryStrategy,
    { siteId, consumableId, expiresOn, lotNumber },
    operation,
    quantity
  )
  let inventoryItemId
  if (actualInventoryItem) {
    ;({ siteId, id: inventoryItemId } = actualInventoryItem)
  }

  // const matchingInventoryItem = await findOrCreateMatchingInventoryItem(
  //   knex,
  //   siteId,
  //   assayConsumable,
  //   consumablesInResultData,
  //   now,
  //   assayConsumable.strategy
  // )

  await transact(async knex => {
    /**
     * change inventory quantity
     */
    inventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItemId,
      consumableId,
      siteId,
      lotNumber,
      expiresOn,
      quantityOnHand,
      now,
      userId,
    })
    /**
     * log changing inventory quantity
     */
    await logInventoryChange({
      knex,
      inventoryItemId,
      consumableId,
      siteId,
      lotNumber,
      expiresOn,
      operation,
      quantity,
      createdOn: now,
      createdBy: userId,
      /**
       * operation-specific props, may overwrite props above
       * (i.e. `operation` to log `modify add` instead of `add`)
       */
      ...logProps,
    })
    /**
     * run needed MQ tasks after changing inventory quantity
     */
    await checkOpenedStockIssues({
      knex,
      siteId,
      consumableId,
      now,
      plugins,
      messageContext,
    })
  })
  return inventoryItemId
}

// ----------------------------------------------------------------------------------
async function addInventory({ auth, payload, plugins }) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategyByAuth(auth)

  const { toSiteId, consumableId, expiresOn, lotNumber, reasonId, dateAdjusted, notes } = payload
  const quantity = Math.abs(payload.quantity)

  const dataConstraints = await getConstraints(auth.credentials)
  const toSite = await getSite(toSiteId, dataConstraints)
  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }

  const { id: userId } = await getUser(auth.credentials.name)

  const inventoryItemId = await changeInventoryQuantity(inventoryStrategy, {
    knex,
    consumableId,
    siteId: toSite.id,
    lotNumber,
    expiresOn,
    quantity,
    operation: 'add',
    now,
    userId,
    plugins, // for getting messageContext
    logProps: {
      consumableReasonId: reasonId,
      adjustedFrom: dateAdjusted,
      notes,
    },
  })
  return getInventoryItem(inventoryItemId)
}

// ----------------------------------------------------------------------------------
async function removeInventory({ auth, payload, plugins }) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategyByAuth(auth)
  const {
    fromSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    reasonId,
    dateAdjusted,
    dateAdjustedFrom,
    dateAdjustedTo,
    notes,
  } = payload
  const quantity = Math.abs(payload.quantity)

  const dataConstraints = await getConstraints(auth.credentials)
  const fromSite = await getSite(fromSiteId, dataConstraints)
  if (!fromSite) {
    return Boom.forbidden('You are not permitted to remove inventory from this site')
  }

  const { id: userId } = await getUser(auth.credentials.name)

  const inventoryItemId = await changeInventoryQuantity(inventoryStrategy, {
    knex,
    consumableId,
    siteId: fromSite.id,
    lotNumber,
    expiresOn,
    quantity,
    operation: 'remove',
    now,
    userId,
    plugins, // for getting messageContext
    logProps: {
      consumableReasonId: reasonId,
      adjustedFrom: dateAdjusted || dateAdjustedFrom,
      adjustedTo: dateAdjustedTo,
      notes,
    },
  })

  return getInventoryItem(inventoryItemId)
}

// ----------------------------------------------------------------------------------
async function receiveInventory({ auth, payload, plugins }) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategyByAuth(auth)

  const { consumableId, expiresOn, lotNumber, quantity, dateAdjusted, notes } = payload
  let { toSiteId, fromSiteId } = payload

  const dataConstraints = await getConstraints(auth.credentials)
  const toSite = await getSite(toSiteId, dataConstraints)
  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }

  const { id: userId } = await getUser(auth.credentials.name)
  const { id: transferReceivedConsumableReasonId } = await findConsumableReason('Transfer Received')
  const baseProps = { consumableId, expiresOn, lotNumber }
  /**
   *
   */
  const fromProps = getActualInventoryItem(inventoryStrategy, { siteId: fromSiteId, ...baseProps }, 'remove', quantity)
  let fromInventoryItemId
  if (fromProps.actualInventoryItem) {
    ;({ siteId: fromSiteId, id: fromInventoryItemId } = fromProps.actualInventoryItem)
  }
  /**
   *
   */
  const toProps = await getActualInventoryItem(
    inventoryStrategy,
    { siteId: toSiteId, ...baseProps, fromSiteId },
    'add',
    quantity
  )
  let toInventoryItemId
  if (toProps.actualInventoryItem) {
    ;({ siteId: toSiteId, id: toInventoryItemId } = toProps.actualInventoryItem)
  } else {
    return Boom.notFound('Could not find source item')
  }

  // // const currentlyLoggedInUser = await getUser(auth.credentials.name)
  // const sourceInventoryItem = await findInventoryItem(toSiteId, consumableId, expiresOn, lotNumber, fromSiteId)
  // if (_.isEmpty(sourceInventoryItem)) {
  //   return Boom.notFound('Could not find source item')
  // }
  // const destinationInventoryItem = await findInventoryItem(toSiteId, consumableId, expiresOn, lotNumber)
  let destinationInventoryItemId = -1
  await transact(async knex => {
    /**
     *
     */
    destinationInventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItemId: toInventoryItemId,
      siteId: toSiteId,
      quantityOnHand: toProps.quantityOnHand,
      inTransitFromSiteId: fromSiteId,
      now,
      userId,
      ...baseProps,
    })
    /**
     *
     */
    await logInventoryChange({
      knex,
      inventoryItemId: toInventoryItemId,
      siteId: toSiteId,
      referencedSiteId: fromSiteId,
      consumableReasonId: transferReceivedConsumableReasonId,
      quantity,
      operation: 'transfer received',
      notes,
      adjustedFrom: dateAdjusted,
      createdOn: now,
      createdBy: userId,
      ...baseProps,
    })

    // check both sites for Stockout/StockExpiring issues
    const props = {
      knex,
      consumableId,
      now,
      plugins,
    }

    await knex('InventoryItem').where('id', fromInventoryItemId).delete()

    await checkOpenedStockIssues({ ...props, siteId: fromSiteId })
    await checkOpenedStockIssues({ ...props, siteId: toSiteId })
  })

  return getInventoryItem(destinationInventoryItemId)
}

// ----------------------------------------------------------------------------------
async function transferInventory({ auth, payload, plugins }) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategyByAuth(auth)

  const { consumableId, expiresOn, lotNumber, quantity, dateAdjusted, notes } = payload
  let { fromSiteId, toSiteId } = payload

  const dataConstraints = await getConstraints(auth.credentials)
  const toSite = await getSite(toSiteId, dataConstraints)
  if (!toSite) {
    return Boom.forbidden('You are not permitted to transfer inventory to this site')
  }
  const fromSite = await getSite(fromSiteId, dataConstraints)
  if (!fromSite) {
    return Boom.forbidden('You are not permitted to transfer inventory from this site')
  }

  const { id: userId } = await getUser(auth.credentials.name)
  const { id: transferSentConsumableReasonId } = await findConsumableReason('Transfer Sent')
  const baseProps = { consumableId, expiresOn, lotNumber, now, userId }
  /**
   *
   */
  const fromProps = await getActualInventoryItem(
    inventoryStrategy,
    { siteId: fromSiteId, ...baseProps },
    'remove',
    quantity
  )
  let fromInventoryItemId
  if (fromProps.actualInventoryItem) {
    ;({ siteId: fromSiteId, id: fromInventoryItemId } = fromProps.actualInventoryItem)
  }
  /**
   *
   */
  const toProps = await getActualInventoryItem(
    inventoryStrategy,
    { siteId: toSiteId, ...baseProps, fromSiteId },
    //
    'add',
    quantity
  )
  let toInventoryItemId
  if (toProps.actualInventoryItem) {
    ;({ siteId: toSiteId, id: toInventoryItemId } = toProps.actualInventoryItem)
  }

  let sourceInventoryItemId = -1
  let destinationInventoryItemId = -1
  await transact(async knex => {
    /**
     *
     */
    destinationInventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItemId: toInventoryItemId,
      siteId: toSiteId,
      quantityOnHand: toProps.quantityOnHand,
      inTransitFromSiteId: fromSiteId,
      ...baseProps,
    })
    /**
     *
     */
    sourceInventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItemId: fromInventoryItemId,
      siteId: fromSiteId,
      quantityOnHand: fromProps.quantityOnHand,
      ...baseProps,
    })

    await logInventoryChange({
      knex,
      inventoryItemId: toInventoryItemId,
      // : sourceInventoryItemId,
      consumableId,
      siteId: fromSiteId,
      referencedSiteId: toSiteId,
      consumableReasonId: transferSentConsumableReasonId,
      lotNumber,
      expiresOn,
      quantity,
      operation: 'transfer sent',
      notes,
      adjustedFrom: dateAdjusted,
      createdOn: now,
      createdBy: userId,
    })

    // check both sites for Stockout/StockExpiring issues
    const props = {
      knex,
      consumableId,
      now,
      plugins,
    }
    await checkOpenedStockIssues({ ...props, siteId: fromSiteId })
    await checkOpenedStockIssues({ ...props, siteId: toSiteId })
  })

  return {
    existingInventoryItem: await getInventoryItem(sourceInventoryItemId),
    newInventoryItem: await getInventoryItem(destinationInventoryItemId),
  }
}

// ----------------------------------------------------------------------------------
async function modifyInventoryOnHand({ auth, payload, plugins }) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategyByAuth(auth)

  const { siteId, consumableId, lotNumber, quantity, dateAdjusted, notes, expiresOn } = payload

  const dataConstraints = await getConstraints(auth.credentials)
  const site = await getSite(siteId, dataConstraints)
  if (!site) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }

  const { id: userId } = await getUser(auth.credentials.name)

  const operation = quantity > 0 ? 'add' : 'remove'

  const { reasonId } =
    (await knex('ConsumableReason')
      .where(
        'i18nKey',
        operation === 'add'
          ? 'ConsumableReason_AssertedInventoryOnHandAdd'
          : 'ConsumableReason_AssertedInventoryOnHandRemove'
      )
      .first('id as reasonId')) || {}

  // if (quantity > 0) {
  //   ;({ reasonId } =
  //     (await knex('ConsumableReason')
  //       .where('i18nKey', 'ConsumableReason_AssertedInventoryOnHandAdd')
  //       .first('id as reasonId')) || {})
  //   // operation = 'add'
  //   // payload.reasonId = reasonId
  //   // result = await increaseInventory(payload)
  // } else {
  //   ;({ reasonId } =
  //     (await knex('ConsumableReason')
  //       .where('i18nKey', 'ConsumableReason_AssertedInventoryOnHandRemove')
  //       .first('id as reasonId')) || {})
  //   // payload.operation = 'remove'
  //   // payload.reasonId = reasonId
  //   // // result = await increaseInventory(payload)
  // }
  // payload = {
  //   ...payload,
  //   // quantity: Math.abs(quantity),
  //   siteId, // <-- in case it was changed because operation is at parent warehouse
  //   quantityOnHand,
  //   reasonId,
  //   operation,
  // }
  const inventoryItemId = await changeInventoryQuantity(inventoryStrategy, {
    knex,
    consumableId,
    siteId,
    lotNumber,
    expiresOn,
    quantity,
    operation,
    now,
    userId,
    plugins, // for getting messageContext
    logProps: {
      consumableReasonId: reasonId,
      adjustedFrom: dateAdjusted,
      operation: `modify ${operation}`,
      notes,
    },
  })
  return getInventoryItem(inventoryItemId)
}

// ----------------------------------------------------------------------------------
async function consumeInventoryForResult(
  resultId,
  assayId,
  siteId,
  consumablesInResultData,
  partnerId,
  testStartedOn,
  testEndedOn,
  knex,
  messageContext,
  userId
) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategy({ partnerId })
  // getInventoryStrategyByAuth(auth)

  const assayConsumables = await selectAssayConsumables(knex, { partner: { id: partnerId } }, assayId)

  const { id: testRunConsumableReasonId } = await findConsumableReason('Test Conducted')

  const affectedInventoryItems = await Promise.all(
    _.map(assayConsumables, async assayConsumable => {
      const { consumableId, quantity } = assayConsumable
      const existingInventoryLog = await knex('InventoryLog as il')
        .join('InventoryItem as ii', 'il.inventoryItemId', 'ii.id')
        .where({
          'il.resultId': resultId,
          'ii.consumableId': consumableId,
        })
        .first('ii.id', 'il.inventoryItemId')

      /**
       * Don't double deduct inventory for the same result
       */
      if (_.isEmpty(existingInventoryLog)) {
        const consumableStrategy = await getConsumableStrategy(consumableId)

        const expiresOn = _.get(consumablesInResultData, '[0].expirationDate')
        const lotNumber = consumableStrategy.find(({ name }) => name.includes('withLot'))
          ? _.get(consumablesInResultData, '[0].lot')
          : undefined
        // assayConsumable.strategy.indexOf('withLot') >= 0 ? _.get(consumablesInResultData, '[0].lot') : undefined

        const inventoryItemId = await changeInventoryQuantity(inventoryStrategy, {
          knex,
          consumableId,
          siteId,
          lotNumber,
          expiresOn,
          quantity,
          operation: 'remove',
          now,
          userId,
          messageContext,
          logProps: {
            consumableReasonId: testRunConsumableReasonId,
            adjustedFrom: testStartedOn,
            adjustedTo: testEndedOn,
            operation: 'result',
            resultId,
            // notes,
          },
        })
        // inventoryItemIds.push(inventoryItemId)
        return getInventoryItem(inventoryItemId)
      }
    })
  )

  return affectedInventoryItems
  // getInventoryItem(inventoryItemId)
}

// ----------------------------------------------------------------------------------
async function findOrCreateMatchingInventoryItem(
  knex,
  siteId,
  assayConsumable,
  consumablesInResultData,
  now,
  strategy
) {
  const expiresOn = _.get(consumablesInResultData, '[0].expirationDate')
  const lotNumber = strategy.indexOf('withLot') >= 0 ? _.get(consumablesInResultData, '[0].lot') : undefined

  const { consumableId } = assayConsumable
  const existingItem = await findInventoryItem(siteId, consumableId, expiresOn, lotNumber, false)

  if (existingItem) {
    return existingItem
  }

  await upsertInventoryItem({
    knex,
    consumableId,
    siteId,
    lotNumber,
    expiresOn,
    quantity: 0,
    now,
  })

  const newItem = await findInventoryItem(siteId, consumableId, expiresOn, lotNumber, false)
  return newItem
}

// ----------------------------------------------------------------------------------
async function checkOpenedStockIssues({ knex, siteId, consumableId, now, plugins, messageContext }) {
  // same query as in onFactCheckInventoryStock() in /src/inventory/service.js, but with additional 'where' for ii.siteId and ii.consumableId
  // this is just for getting dueDaysInventoryStockout and dueDaysInventoryStockExpiring values
  const [site] = await knex('InventoryItem as ii')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .innerJoin('Partner as p', 's.partnerId', 'p.id')
    .where('ii.siteId', siteId)
    .where('ii.consumableId', consumableId)
    .where(function () {
      this.whereNull('ii.expiresOn') // if is null
        .orWhere('ii.expiresOn', '>', now) // or unexpired
    })
    .groupBy('ii.siteId', 'ii.consumableId')
    .select(
      'ii.siteId',
      'ii.consumableId',
      knex.raw('MAX(p.dueDaysInventoryStockout) as dueDaysInventoryStockout'),
      knex.raw('MAX(p.dueDaysInventoryStockExpiring) as dueDaysInventoryStockExpiring')
    )
  // notice that 'rate' field in table FactInventoryConsumptionRate stores total number of
  // tests during corresponding 'days'. So for actual rate you should do rate/days, but
  // for days=1 use 'rate' as-is
  const { rate: dailyRate } = (await knex('FactInventoryConsumptionRate')
    .where({ siteId, consumableId, days: 1 })
    .first('rate')) || { rate: 0 }

  // 'dailyRate' should be always>0 if there is at least one result
  // 'site' may be undefinied if InventoryItem.expiresOn is less than today
  if (site && dailyRate > 0) {
    // try to resolve Stockout/StockExpiring issues, if any opened for this site/consumable
    if (!messageContext) {
      messageContext = plugins.messageContext.bindActionCreators({
        inventoryStockout,
        inventoryStockExpiring,
        resolveIssues,
        escalateIssues,
      })
    }
    const props = {
      knex,
      siteId,
      consumableId,
      dailyRate,
      messageContext,
    }

    await checkStockoutIssues({
      dueDays: site.dueDaysInventoryStockout,
      ...props,
    })

    await checkStockExpiringIssues({
      dueDays: site.dueDaysInventoryStockExpiring,
      ...props,
    })
  }
}

// ----------------------------------------------------------------------------------
async function checkStockoutIssues({ knex, siteId, consumableId, dailyRate, dueDays, messageContext }) {
  // see if need to trigger issue - call same func as scheduler
  await auditInventoryStockout({
    knex,
    site: { siteId, consumableId },
    dailyRate,
    dueDays,
    trigger: messageContext.inventoryStockout,
    resolver: messageContext.resolveIssues,
    escalator: messageContext.escalateIssues,
  })
}

// ----------------------------------------------------------------------------------
async function checkStockExpiringIssues({ knex, siteId, consumableId, dailyRate, dueDays, messageContext }) {
  // see if need to trigger issue - call same func as scheduler
  await auditInventoryStockExpiring({
    knex,
    site: { siteId, consumableId },
    dailyRate,
    dueDays,
    trigger: messageContext.inventoryStockExpiring,
    resolver: messageContext.resolveIssues,
    escalator: messageContext.escalateIssues,
  })
}

module.exports = {
  getInventoryStrategy,
  //
  addInventory,
  removeInventory,
  receiveInventory,
  transferInventory,
  modifyInventoryOnHand,

  changeInventoryQuantity,
  consumeInventoryForResult,
  findOrCreateMatchingInventoryItem,
}
