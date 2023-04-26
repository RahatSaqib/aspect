const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')

const { getUser } = require('../auth/service')
const { getPartnerPluginName, getDeviceTypePluginName } = require('../plugin/utils')
const defaultInventoryStrategy = require('./strategies')

const { knex, transact } = require('../db')
const { getSite } = require('../site/service')
const { getConstraints } = require('../auth/constraints')
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

const MODE = {
  TRANSFER: 'TRANSFER',
  RECEIVE: 'RECEIVE',
}

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
 * we return array of such objects - { quantityOnHand, inventoryItem }
 * where item on index 0 is current inventory which is being changed,
 * and on index 1 (possibly) - item for parent warehouse which we also need to update
 * because we might auto-transferred inventories from it in case if current site
 * doesn't have enough inventories
 */
async function getActualInventoryItems(
  knex,
  inventoryStrategy,
  { siteId, consumableId, expiresOn, lotNumber, fromSiteId, resultId },
  operation,
  { quantityOnHand, quantity }
) {
  const currentInventoryItem = await findInventoryItem(siteId, consumableId, expiresOn, lotNumber, fromSiteId)
  const actualInventoryItemProps = await inventoryStrategy.getNewQuantityOnHand(
    knex,
    currentInventoryItem,
    operation,
    quantityOnHand,
    quantity,
    { resultId, userId: inventoryStrategy.getUserId() }
  )
  return actualInventoryItemProps
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
  await logInventoryChange({
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

  return inventoryItemId
}

// ----------------------------------------------------------------------------------
async function doChangeQuantityInTransactBody(
  knex,
  actualInventoryItemProps,
  { siteId, consumableId, lotNumber, expiresOn, inTransitFromSiteId, now, userId, logProps }
) {
  return Promise.map(actualInventoryItemProps, async ({ quantityOnHand, inventoryItem }) => {
    /**
     * notice that `inventoryItem` may be undefined (and be inserted)
     */
    return upsertInventoryItemAndLog(knex, {
      inventoryItemId: inventoryItem?.id,
      quantityOnHand,
      siteId: inventoryItem?.siteId ?? siteId,
      consumableId,
      lotNumber,
      expiresOn,
      inTransitFromSiteId,
      now,
      userId,
      logProps,
    })
  })
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
  const getAffectedItemIds = async knex => {
    const actualInventoryItemProps = await getActualInventoryItems(
      knex,
      inventoryStrategy,
      { siteId, consumableId, expiresOn, lotNumber, resultId },
      operation,
      { quantityOnHand, quantity }
    )
    if (Boom.isBoom(actualInventoryItemProps)) {
      return actualInventoryItemProps
    }
    const itemIds = await doChangeQuantityInTransactBody(knex, actualInventoryItemProps, {
      siteId,
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

    return actualInventoryItemProps.map(({ inventoryItem }, index) => {
      const inventoryItemId = itemIds[index]
      return {
        siteId: inventoryItem?.siteId ?? siteId,
        consumableId,
        inventoryItemId,
      }
    })
  }

  let affectedInventoryItemProps
  if (params.knex) {
    // if `knex` is passed via `params` then we are inside transaction and must use it
    affectedInventoryItemProps = await getAffectedItemIds(params.knex)
  } else {
    affectedInventoryItemProps = await transact(async knex => getAffectedItemIds(knex))
  }
  if (Boom.isBoom(affectedInventoryItemProps)) {
    return affectedInventoryItemProps
  }
  /**
   * run needed MQ tasks after changing inventory quantity
   * Notice that we here run all MQ tasks AFTER changing inventory - to make
   * sure that MQ handler for sure is dealing with already committed
   * above transactions
   */
  await Promise.each(affectedInventoryItemProps, async ({ siteId, consumableId }) =>
    checkOpenedStockIssues({
      knex: params.knex || knex,
      siteId,
      consumableId,
      now,
      plugins,
      messageContext,
    })
  )
  return affectedInventoryItemProps.map(x => x.inventoryItemId)
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
  const inventoryItemIds = await changeInventoryQuantity(inventoryStrategy, {
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
  if (Boom.isBoom(inventoryItemIds)) {
    return inventoryItemIds
  }
  return getInventoryItem(inventoryItemIds[0])
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
  const inventoryItemIds = await changeInventoryQuantity(inventoryStrategy, {
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
  if (Boom.isBoom(inventoryItemIds)) {
    return inventoryItemIds
  }
  return getInventoryItem(inventoryItemIds[0])
}

// ----------------------------------------------------------------------------------
async function receiveInventory({ auth, payload, plugins }) {
  const res = await transferOrReceiveInventory({ auth, payload, plugins }, MODE.RECEIVE)
  if (Boom.isBoom(res)) return res
  return res.newInventoryItem
}

// ----------------------------------------------------------------------------------
async function transferInventory({ auth, payload, plugins }) {
  const res = await transferOrReceiveInventory({ auth, payload, plugins }, MODE.TRANSFER)
  // may be object { existingInventoryItem, newInventoryItem } or Boom
  return res
}

// ----------------------------------------------------------------------------------
async function transferOrReceiveInventory({ auth, payload, plugins }, mode) {
  const now = new Date()
  const {
    // from/to site Id's - may be processed only one or both
    fromSiteId,
    toSiteId,
    // common props
    consumableId,
    expiresOn,
    lotNumber,
    quantity,
    dateAdjusted,
    notes,
    resultId,
  } = payload
  const inventoryStrategy = await getInventoryStrategyByAuth(auth)
  const { transferInPendingMode } = inventoryStrategy
  const isDoingAllHere = mode === MODE.TRANSFER && !transferInPendingMode
  const isReceivePending = mode === MODE.TRANSFER && transferInPendingMode
  const isReceiveFinishing = mode === MODE.RECEIVE && transferInPendingMode
  const canProcessFrom = isDoingAllHere || mode === MODE.TRANSFER
  const canProcessTo = isDoingAllHere || mode === MODE.RECEIVE || isReceivePending
  /**
   * common props for both `transfer` and `receive` modes
   */
  const dataConstraints = await getConstraints(auth.credentials)
  const { id: userId } = await getUser(auth.credentials.name)
  const baseProps = { consumableId, expiresOn, lotNumber, resultId }
  const transactionProps = {
    consumableId,
    lotNumber,
    expiresOn,
    now,
    userId,
    plugins,
  }
  // helper for shortening length of lines below
  const getProps = (siteId, fromSiteId) => {
    return { siteId, fromSiteId, ...baseProps }
  }
  const resultOfTransaction = await transact(async knex => {
    let res
    /** ***********************
     * process `fromSiteId`
     */
    if (canProcessFrom) {
      const fromSite = await getSite(fromSiteId, dataConstraints)
      if (!fromSite) {
        return Boom.forbidden('You are not permitted to transfer inventory from this site')
      }
      const { id: transferSentConsumableReasonId } = await findConsumableReason('Transfer Sent')
      transactionProps.from = {
        siteId: fromSiteId,
        logProps: {
          quantity,
          operation: 'transfer sent',
          referencedSiteId: toSiteId,
          consumableReasonId: transferSentConsumableReasonId,
          notes,
          adjustedFrom: dateAdjusted,
        },
      }
      /**
       * from source site we remove `quantity` - this may affect not only current site
       * but also parent site of warehouse when current site doesn't have enough items,
       * and because of that returning array of `from.props` consists of either 1 or 2 entries
       */
      res = await getActualInventoryItems(knex, inventoryStrategy, getProps(fromSiteId), 'remove', { quantity })
      if (Boom.isBoom(res)) {
        return res
      }
      transactionProps.from.props = res
    }

    /** ***********************
     * process `toSiteId`
     */
    if (canProcessTo) {
      const toSite = await getSite(toSiteId, dataConstraints)
      if (!toSite) {
        return Boom.forbidden('You are not permitted to add inventory to this site')
      }
      const { id: transferReceivedConsumableReasonId } = await findConsumableReason('Transfer Received')
      /**
       * When `isReceiveFinishing = true` then we don't need to change quantity in `to` site
       * because it has already been changed due to `pending` mode on  processing `transfer`.
       * In a such use case here we need only set `inTransitFromSiteId` to `null` and log.
       */
      const actualQuantity = isReceiveFinishing ? 0 : quantity
      transactionProps.to = {
        siteId: toSiteId,
        logProps: {
          quantity: actualQuantity,
          operation: isReceiveFinishing ? 'transfer committed' : 'transfer received',
          referencedSiteId: fromSiteId,
          consumableReasonId: transferReceivedConsumableReasonId,
          notes,
          adjustedFrom: dateAdjusted,
        },
        inTransitFromSiteId: isReceivePending ? fromSiteId : null,
      }
      /**
       * we add `quantity` items to destination site - this affects only current site
       * of `toSiteId` (not parent warehouse site), and because of that returning array
       * of `to.props` consists of only 1 entry
       */
      res = await getActualInventoryItems(knex, inventoryStrategy, getProps(toSiteId, fromSiteId), 'add', {
        quantity: actualQuantity,
      })
      if (Boom.isBoom(res)) {
        return res
      }
      transactionProps.to.props = res
    }
    return doFromTo(knex, transactionProps)
  })

  if (Boom.isBoom(resultOfTransaction)) {
    return resultOfTransaction
  }

  const { fromInventoryItemIds, toInventoryItemIds } = resultOfTransaction
  const resp = {}
  if (fromInventoryItemIds) {
    resp.existingInventoryItem = await getInventoryItem(fromInventoryItemIds[0])
  }
  if (toInventoryItemIds) {
    resp.newInventoryItem = await getInventoryItem(toInventoryItemIds[0])
  }
  return resp
}

// ----------------------------------------------------------------------------------
async function doFromTo(knex, { consumableId, lotNumber, expiresOn, now, userId, from, to }) {
  const baseProps = {
    consumableId,
    lotNumber,
    expiresOn,
    now,
    userId,
  }
  const resp = {}
  /**
   *
   */
  if (from) {
    resp.fromInventoryItemIds = await doChangeQuantityInTransactBody(knex, from.props, {
      ...baseProps,
      siteId: from.siteId,
      logProps: from.logProps,
    })
  }
  /**
   *
   */
  if (to) {
    resp.toInventoryItemIds = await doChangeQuantityInTransactBody(knex, to.props, {
      ...baseProps,
      siteId: to.siteId,
      logProps: to.logProps,
      inTransitFromSiteId: to.inTransitFromSiteId,
    })
  }

  return resp
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

  const inventoryItemIds = await changeInventoryQuantity(inventoryStrategy, {
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
  if (Boom.isBoom(inventoryItemIds)) {
    return inventoryItemIds
  }
  return getInventoryItem(inventoryItemIds[0])
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
