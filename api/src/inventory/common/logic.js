const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')

const { getUser } = require('../../auth/service')
const { getPartnerPluginName, getDeviceTypePluginName } = require('../../plugin/utils')
const defaultInventoryStrategy = require('../strategies')

const { knex, transact } = require('../../db')
const { getSite } = require('../../site/service')
const { getConstraints } = require('../../auth/constraints')
const { selectAssayConsumables } = require('../../consumable/assayConsumableService')
const { findConsumableReason } = require('../../consumable/consumableService')
const { resolveIssues, escalateIssues } = require('../../issue/actions')
const { inventoryStockout, inventoryStockExpiring } = require('../actions')
const { auditInventoryStockout, auditInventoryStockExpiring } = require('../../shared/utilsInventory')

const {
  findInventoryItem,
  getInventoryItem,
  //
  updateInventoryItem,
  insertInventoryItem,
  logInventoryChange,
  getConsumableStrategy,
  createInventoryTransfer,
  updateInventoryTransfer,
} = require('./db')

/**
 * use singleton for inventory strategy instance - cache it in a single instance
 * by key consisted of `partnerId` and `deviceId`
 */
const cachedInventoryStrategies = {}
async function getInventoryStrategy({ partnerId, deviceId, userId }) {
  const inventoryStrategyKey = `partnerId-${partnerId || 0}_deviceId-${deviceId || 0}`
  let inventoryStrategy = cachedInventoryStrategies[inventoryStrategyKey]
  if (!inventoryStrategy) {
    const partnerPluginName = await getPartnerPluginName({ partnerId })
    const deviceTypePluginName = await getDeviceTypePluginName(deviceId)
    const { loadPlugin } = require('../../plugin/registration')
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
    inventoryStrategy.setUserId(userId)
  }

  return inventoryStrategy
}

// ----------------------------------------------------------------------------------
async function getInventoryStrategyByAuth(auth) {
  const { partnerId, userId } = await getUser(auth.credentials.name)
  return getInventoryStrategy({ partnerId, userId })
}

// ----------------------------------------------------------------------------------
async function upsertInventoryItem({
  knex,
  inventoryItemId,
  consumableId,
  siteId,
  lotNumber,
  expiresOn,
  quantityOnHand,
  now,
  userId,
  inTransitFromSiteId,
}) {
  if (inventoryItemId) {
    await updateInventoryItem(knex, inventoryItemId, {
      quantityOnHand,
      inTransitFromSiteId: inTransitFromSiteId || null,
      updatedOn: now,
      updatedBy: userId,
    })
  } else {
    ;[inventoryItemId] = await insertInventoryItem(knex, {
      consumableId,
      inTransitFromSiteId: inTransitFromSiteId || null,
      siteId,
      lotNumber,
      expiresOn,
      quantityOnHand,
      updatedOn: now,
      updatedBy: userId,
      createdOn: now,
      createdBy: userId,
    })
  }

  return inventoryItemId
}

// ----------------------------------------------------------------------------------
/**
 * return object { quantityOnHand, inventoryItem } where `quantityOnHand` is correctly calculated by InventoryStrategy
 * and `inventoryItem` may be undefined in case when no such inventory found and it will be created
 * in upsertInventoryItem
 */
async function getActualQuantityOnHand(
  knex,
  inventoryStrategy,
  { siteId, consumableId, expiresOn, lotNumber, fromSiteId, resultId },
  operation,
  { quantityOnHand, quantity }
) {
  const inventoryItem = await findInventoryItem(siteId, consumableId, expiresOn, lotNumber, fromSiteId)
  const newQuantityOnHand = await inventoryStrategy.getNewQuantityOnHand(
    knex,
    inventoryItem,
    operation,
    quantityOnHand,
    quantity,
    { resultId, userId: inventoryStrategy.getUserId() }
  )
  if (Boom.isBoom(newQuantityOnHand)) {
    return newQuantityOnHand
  }
  return { inventoryItem, quantityOnHand: newQuantityOnHand }
}

// ----------------------------------------------------------------------------------
async function upsertInventoryItemAndLog(
  knex,
  {
    /**
     * props depending on strategy:
     * - `siteId` may be changed (processing also warehouse when current site doesn't have items)
     * - `quantityOnHand` - may deduct some from current site and the rest from warehouse
     */
    inventoryItemId,
    quantityOnHand,
    siteId,
    /**
     * common props
     */
    consumableId,
    lotNumber,
    expiresOn,
    inTransitFromSiteId,
    now,
    userId,
    logProps,
  }
) {
  /**
   * change inventory quantity
   */
  inventoryItemId = await upsertInventoryItem({
    knex,
    inventoryItemId,
    quantityOnHand,
    siteId,
    consumableId,
    lotNumber,
    expiresOn,
    inTransitFromSiteId,
    now,
    userId,
  })
  /**
   * log changing inventory quantity
   */
  const inventoryLogId = await logInventoryChange({
    knex,
    inventoryItemId,
    consumableId,
    siteId,
    lotNumber,
    expiresOn,
    createdOn: now,
    createdBy: userId,
    ...logProps,
  })

  return { inventoryItemId, inventoryLogId }
}

// ----------------------------------------------------------------------------------
async function changeInventoryQuantity(inventoryStrategy, params) {
  const {
    /* knex, // <--- if defined then we are inside transaction and must use this `knex` */
    consumableId,
    siteId,
    lotNumber,
    expiresOn,
    quantityOnHand,
    quantity, // is positive and works with `operation` to add/remove/transfer/receive
    operation,
    inTransitFromSiteId,
    now,
    userId,
    logProps,
    resultId,
    /**
     * `plugins` is coming from original `request`, and is used for getting messageContext
     * in case if `messageContext` is not passed here in params
     */
    plugins,
    messageContext,
  } = params
  const getAffectedIds = async knex => {
    const res = await getActualQuantityOnHand(
      knex,
      inventoryStrategy,
      { siteId, consumableId, expiresOn, lotNumber, resultId },
      operation,
      { quantityOnHand, quantity }
    )
    if (Boom.isBoom(res)) {
      return res
    }
    /**
     * return object { inventoryItemId, inventoryLogId }
     */
    return upsertInventoryItemAndLog(knex, {
      inventoryItemId: res.inventoryItem?.id,
      quantityOnHand: res.quantityOnHand,
      siteId: res.inventoryItem?.siteId ?? siteId,
      consumableId,
      lotNumber,
      expiresOn,
      inTransitFromSiteId,
      now,
      userId,
      logProps: {
        operation,
        quantity,
        ...logProps,
      },
    })
  }

  let res
  if (params.knex) {
    // if `knex` is passed via `params` then we are inside transaction and must use it
    res = await getAffectedIds(params.knex)
  } else {
    res = await transact(async knex => getAffectedIds(knex))
  }
  if (Boom.isBoom(res)) {
    return res
  }
  /**
   * run needed MQ tasks after changing inventory quantity
   * Notice that we here run all MQ tasks AFTER changing inventory - to make
   * sure that MQ handler for sure is dealing with already committed
   * above transactions
   */
  await checkOpenedStockIssues({
    knex: params.knex || knex,
    siteId,
    consumableId,
    now,
    plugins,
    messageContext,
  })

  return res
}

// ----------------------------------------------------------------------------------
async function addInventory({ auth, payload, plugins }) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategyByAuth(auth)
  const quantity = Math.abs(payload.quantity)
  const { toSiteId, consumableId, expiresOn, lotNumber, reasonId, dateAdjusted, notes, resultId } = payload
  const dataConstraints = await getConstraints(auth.credentials)
  const toSite = await getSite(toSiteId, dataConstraints)
  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }
  const { id: userId } = await getUser(auth.credentials.name)
  /**
   * take 1st item from returning array of affected items
   */
  const res = await changeInventoryQuantity(inventoryStrategy, {
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
    resultId,
  })
  if (Boom.isBoom(res)) {
    return res
  }
  return getInventoryItem(res.inventoryItemId)
}

// ----------------------------------------------------------------------------------
async function removeInventory({ auth, payload, plugins }) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategyByAuth(auth)
  const quantity = Math.abs(payload.quantity)
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
    resultId,
  } = payload
  const dataConstraints = await getConstraints(auth.credentials)
  const fromSite = await getSite(fromSiteId, dataConstraints)
  if (!fromSite) {
    return Boom.forbidden('You are not permitted to remove inventory from this site')
  }
  const { id: userId } = await getUser(auth.credentials.name)
  /**
   *
   */
  const res = await changeInventoryQuantity(inventoryStrategy, {
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
    resultId,
  })
  if (Boom.isBoom(res)) {
    return res
  }
  return getInventoryItem(res.inventoryItemId)
}

// ----------------------------------------------------------------------------------
async function transferInventory({ payload, messageContext, partnerId, userId }) {
  const { fromSiteId, toSiteId, consumableId, expiresOn, lotNumber, quantity, dateAdjusted, notes, logProps, force } =
    payload

  /**
   * get MQ context and bind few action creators
   */
  messageContext = messageContext.bindActionCreators({
    inventoryStockout,
    inventoryStockExpiring,
    resolveIssues,
    escalateIssues,
  })

  /**
   * using inventory strategy get quantityOnHand for source and destination sites
   */
  const inventoryStrategy = await getInventoryStrategy({ partnerId, userId })
  const transferInPendingMode = inventoryStrategy.transferInPendingMode && force !== true
  const source = await getActualQuantityOnHand(
    knex,
    inventoryStrategy,
    { siteId: fromSiteId, consumableId, expiresOn, lotNumber },
    'transfer from',
    { quantity }
  )
  if (Boom.isBoom(source)) {
    return source
  }
  const destination = await getActualQuantityOnHand(
    knex,
    inventoryStrategy,
    { siteId: toSiteId, consumableId, expiresOn, lotNumber, fromSiteId },
    'receive to',
    { quantity }
  )
  if (Boom.isBoom(destination)) {
    return destination
  }

  const now = new Date()

  let destinationInventoryItemId = -1
  let sourceInventoryItemId = -1
  await transact(async knex => {
    destinationInventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItemId: destination.inventoryItem?.id,
      consumableId,
      siteId: toSiteId,
      lotNumber,
      expiresOn,
      quantityOnHand: destination.quantityOnHand,
      now,
      userId,
      inTransitFromSiteId: transferInPendingMode ? fromSiteId : null,
    })

    const { id: transferSentConsumableReasonId } = await findConsumableReason('Transfer Sent')

    sourceInventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItemId: source.inventoryItem?.id,
      consumableId,
      siteId: fromSiteId,
      lotNumber,
      expiresOn,
      quantityOnHand: source.quantityOnHand,
      now,
      userId,
    })

    const outcomeInventoryLogId = await logInventoryChange({
      knex,
      inventoryItemId: sourceInventoryItemId,
      consumableId,
      siteId: fromSiteId,
      referencedSiteId: toSiteId,
      consumableReasonId: transferSentConsumableReasonId,
      lotNumber,
      expiresOn,
      quantity,
      operation: 'transfer from',
      notes,
      adjustedFrom: dateAdjusted,
      createdOn: now,
      createdBy: userId,
      ...logProps,
    })

    await createInventoryTransfer(knex, outcomeInventoryLogId, destinationInventoryItemId)
    if (!transferInPendingMode) {
      const { id: transferReceivedConsumableReasonId } = await findConsumableReason('Transfer Received')
      const incomeInventoryLogId = await logInventoryChange({
        knex,
        inventoryItemId: destinationInventoryItemId,
        consumableId,
        siteId: toSiteId,
        referencedSiteId: fromSiteId,
        consumableReasonId: transferReceivedConsumableReasonId,
        lotNumber,
        expiresOn,
        quantity,
        operation: 'receive to',
        notes,
        adjustedFrom: dateAdjusted,
        createdOn: now,
        createdBy: userId,
      })
      await updateInventoryTransfer(knex, destinationInventoryItemId, incomeInventoryLogId)
    }
    /**
     * check both sites for Stockout/StockExpiring issues
     */
    const props = {
      knex,
      consumableId,
      now,
      messageContext,
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
async function receiveInventory(request) {
  const {
    auth,
    payload: { fromSiteId, toSiteId, consumableId, expiresOn, lotNumber, quantity, dateAdjusted, notes },
  } = request

  const dataConstraints = await getConstraints(auth.credentials)
  const toSite = await getSite(toSiteId, dataConstraints)
  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }
  /**
   * using inventory strategy get quantityOnHand for destination sites
   */
  const { partnerId, userId } = await getUser(auth.credentials.name)
  const inventoryStrategy = await getInventoryStrategy({ partnerId, userId })
  if (!inventoryStrategy.transferInPendingMode) {
    return Boom.notFound(
      'Inventory strategy does not allow pending mode for transferring inventory - it has been already processed in transferInventory'
    )
  }
  const destination = await getActualQuantityOnHand(
    knex,
    inventoryStrategy,
    { siteId: toSiteId, consumableId, expiresOn, lotNumber },
    'receive to',
    { quantity }
  )
  if (Boom.isBoom(destination)) {
    return destination
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()
  const inTransitInventoryItem = await findInventoryItem(toSiteId, consumableId, expiresOn, lotNumber, fromSiteId)
  if (_.isEmpty(inTransitInventoryItem)) {
    return Boom.notFound('Could not find source item')
  }
  let destinationInventoryItemId = -1
  await transact(async knex => {
    destinationInventoryItemId = await upsertInventoryItem({
      knex,
      inventoryItemId: destination.inventoryItem?.id,
      consumableId,
      siteId: toSiteId,
      lotNumber,
      expiresOn,
      quantityOnHand: destination.quantityOnHand,
      now,
      userId: currentlyLoggedInUser.id,
    })

    const { id: transferReceivedConsumableReasonId } = await findConsumableReason('Transfer Received')

    const incomeInventoryLogId = await logInventoryChange({
      knex,
      inventoryItemId: destinationInventoryItemId,
      consumableId,
      siteId: toSiteId,
      referencedSiteId: fromSiteId,
      consumableReasonId: transferReceivedConsumableReasonId,
      lotNumber,
      expiresOn,
      quantity,
      operation: 'receive to',
      notes,
      adjustedFrom: dateAdjusted,
      createdOn: now,
      createdBy: currentlyLoggedInUser.id,
    })
    await updateInventoryTransfer(knex, inTransitInventoryItem.id, incomeInventoryLogId)

    await knex('InventoryItem').where('id', inTransitInventoryItem.id).delete()
  })

  return getInventoryItem(destinationInventoryItemId)
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

  const res = await changeInventoryQuantity(inventoryStrategy, {
    consumableId,
    siteId,
    lotNumber,
    expiresOn,
    /**
     * make sure `quantity` is positive, because we add (quantityOnHand + quantity) or
     * remove (quantityOnHand - quantity) based on `operation`. And if `quantity` remains
     * negative for `remove` - then we increase instead of decreasing in, for instance,
     * inventory strategy for Pakistan - api/src/plugin/partner/Pakistan/inventoryStrategy.js
     */
    quantity: Math.abs(quantity),
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
  if (Boom.isBoom(res)) {
    return res
  }
  return getInventoryItem(res.inventoryItemId)
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
  knex, // <--- means we are inside transaction and should use this `knex`
  messageContext,
  userId
) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategy({ partnerId })

  const assayConsumables = await selectAssayConsumables(knex, { partner: { id: partnerId } }, assayId)

  const { id: testRunConsumableReasonId } = await findConsumableReason('Test Conducted')
  await Promise.all(
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
        return changeInventoryQuantity(inventoryStrategy, {
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
            effectiveDate: testEndedOn,
          },
          resultId,
        })
      }
    })
  )
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
    messageContext = plugins?.messageContext || messageContext
    messageContext = messageContext.bindActionCreators({
      inventoryStockout,
      inventoryStockExpiring,
      resolveIssues,
      escalateIssues,
    })

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
  transferInventory,
  receiveInventory,
  modifyInventoryOnHand,
  //
  changeInventoryQuantity,
  consumeInventoryForResult,
  findOrCreateMatchingInventoryItem,
}
