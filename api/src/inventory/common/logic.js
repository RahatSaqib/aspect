const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')

const { getUser } = require('../../auth/service')
const defaultInventoryStrategy = require('../strategies')

const { knex, transact } = require('../../db')
const { getSite } = require('../../site/service')
const { INVENTORY_ADJUSTMENT, INVENTORY_STRATEGY } = require('../../shared/constants')
const { updateSiteConsumable, getSiteListModifiedQuery } = require('../../site/common/db')
const { getPartnerByConstraints } = require('../../partner/common/db')
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
  createInventoryTransfer,
  updateInventoryTransfer,
} = require('./db')
const { INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY } = require('./querySelectors')

/**
 * use singleton for inventory strategy instance - cache it in a single instance
 * by key consisted of `partnerId` and `deviceId`
 */
const cachedInventoryStrategies = {}
async function getInventoryStrategy({ partnerId, deviceId, userId }) {
  const inventoryStrategyKey = `partnerId-${partnerId || 0}_deviceId-${deviceId || 0}`
  let inventoryStrategy = cachedInventoryStrategies[inventoryStrategyKey]
  if (!inventoryStrategy) {
    cachedInventoryStrategies[inventoryStrategyKey] = {
      /**
       * first add all exported items for default strategy...
       */
      ...defaultInventoryStrategy,
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
  } else if (quantityOnHand > 0) {
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
  { siteId, consumableId, expiresOn, lotNumber, fromSiteId, resultId, isUnreconciledResult, partnerId },
  operation,
  { quantityOnHand, quantity }
) {
  const inventoryItem = await findInventoryItem({
    siteId,
    consumableId,
    expiresOn,
    lotNumber,
    inTransitFromSiteId: fromSiteId,
    partnerId,
    resultId,
  })
  const { newQuantityOnHand, isResultPendingReconciliation } = await defaultInventoryStrategy.getNewQuantityOnHand(
    knex,
    inventoryItem,
    operation,
    quantityOnHand,
    quantity,
    {
      resultId,
      userId: inventoryStrategy.getUserId(),
      isUnreconciledResult,
    }
  )
  if (Boom.isBoom(newQuantityOnHand)) {
    return newQuantityOnHand
  }
  return { inventoryItem, quantityOnHand: newQuantityOnHand, isResultPendingReconciliation }
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
    inventoryAdjustment,
    inventoryStrategy,
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
    reconcilationAdjustment: inventoryAdjustment,
    reconcilationStrategy: inventoryStrategy,
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
    inventoryAdjustment,
    partnerId,
    partnerInventoryStrategy,
    logProps,
    resultId,
    /**
     * `plugins` is coming from original `request`, and is used for getting messageContext
     * in case if `messageContext` is not passed here in params
     */
    plugins,
    messageContext,
    isUnreconciledResult,
  } = params
  const getAffectedIds = async knex => {
    const res = await getActualQuantityOnHand(
      knex,
      inventoryStrategy,
      { siteId, consumableId, expiresOn, lotNumber, resultId, isUnreconciledResult, partnerId },
      operation,
      { quantityOnHand, quantity }
    )
    if (Boom.isBoom(res)) {
      return res
    }

    /**
     * return object { inventoryItemId, inventoryLogId }
     */
    if (!res.isResultPendingReconciliation)
      return upsertInventoryItemAndLog(knex, {
        inventoryItemId: res.inventoryItem?.id,
        quantityOnHand: res.quantityOnHand,
        siteId: res.inventoryItem?.siteId ?? siteId,
        consumableId,
        lotNumber,
        ...(resultId && { inventoryAdjustment, inventoryStrategy: partnerInventoryStrategy }),
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
  const { id: userId, partnerId } = await getUser(auth.credentials.name)
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
    partnerId,
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
  await updateSiteConsumable(toSite.id, { modify: 'add', consumableId })

  return getInventoryItem(res.inventoryItemId, INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY)
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
  const { id: userId, partnerId } = await getUser(auth.credentials.name)
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
    partnerId,
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
  const {
    fromSiteId,
    toSiteId,
    resultId,
    consumableId,
    expiresOn,
    lotNumber,
    quantity,
    dateAdjusted,
    notes,
    logProps,
    force,
    inventoryAdjustment,
    partnerInventoryStrategy,
  } = payload

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
    { siteId: fromSiteId, consumableId, expiresOn, lotNumber, partnerId },
    'transfer from',
    { quantity }
  )
  if (Boom.isBoom(source)) {
    return source
  }
  const destination = await getActualQuantityOnHand(
    knex,
    inventoryStrategy,
    { siteId: toSiteId, consumableId, expiresOn, lotNumber, fromSiteId, partnerId },
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
      resultId,
      reconcilationAdjustment: inventoryAdjustment,
      reconcilationStrategy: partnerInventoryStrategy,
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
        resultId,
        reconcilationAdjustment: inventoryAdjustment,
        reconcilationStrategy: partnerInventoryStrategy,
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
    existingInventoryItem: await getInventoryItem(sourceInventoryItemId, INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY),
    newInventoryItem: await getInventoryItem(destinationInventoryItemId, INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY),
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
    { siteId: toSiteId, consumableId, expiresOn, lotNumber, partnerId },
    'receive to',
    { quantity }
  )
  if (Boom.isBoom(destination)) {
    return destination
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()
  const inTransitInventoryItem = await findInventoryItem({
    siteId: toSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    inTransitFromSiteId: fromSiteId,
    partnerId,
  })
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
    await updateSiteConsumable(toSiteId, { modify: 'add', consumableId }, knex)

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
  return getInventoryItem(destinationInventoryItemId, INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY)
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

  const { id: userId, partnerId } = await getUser(auth.credentials.name)

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
    partnerId,
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

// Function to transfer inventory from a source site to a target site
async function transferInventoryFromSourceToTarget({
  sourceSiteId,
  targetSiteId,
  consumableId,
  quantity,
  lotNumber,
  expiresOn,
  partnerId,
  userId,
  messageContext,
  inventoryAdjustment,
  partnerInventoryStrategy,
}) {
  const payload = {
    dateAdjusted: new Date(),
    quantity,
    lotNumber,
    toSiteId: targetSiteId,
    fromSiteId: sourceSiteId,
    expiresOn,
    consumableId,
    force: true,
    inventoryAdjustment,
    partnerInventoryStrategy,
  }

  const res = await transferInventory({ payload, partnerId, userId, messageContext })
  if (Boom.isBoom(res)) {
    return { success: false, error: res }
  }
  return { success: true }
}

// Recursive function to find inventory and transfer if available
async function findAndTransferInventory({
  originalSiteId,
  currentSiteId,
  consumableId,
  quantity,
  expiresOn,
  lotNumber,
  partnerId,
  userId,
  resultId,
  messageContext,
  dataConstraints,
  inventoryAdjustment,
  partnerInventoryStrategy,
  visitedWarehouses = new Set(), // Track visited warehouses to prevent circular dependency
}) {
  // If the current site has already been visited, return to avoid circular dependency
  if (visitedWarehouses.has(currentSiteId)) {
    return { success: false, message: 'Circular dependency detected in warehouse hierarchy' }
  }

  visitedWarehouses.add(currentSiteId)

  const site = await getSite(currentSiteId, dataConstraints)

  const inventoryItem = await findInventoryItem({
    siteId: currentSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    partnerId,
  })

  if (inventoryItem?.quantityOnHand >= quantity) {
    if (currentSiteId !== originalSiteId) {
      return transferInventoryFromSourceToTarget({
        sourceSiteId: currentSiteId,
        targetSiteId: originalSiteId,
        consumableId,
        quantity,
        lotNumber,
        expiresOn,
        partnerId,
        userId,
        resultId,
        messageContext,
        inventoryAdjustment,
        partnerInventoryStrategy,
      })
    }
    return { success: true, message: 'Sufficient inventory found at the original site' }
  }

  //  based on the adjustment type, terminate the recursion
  if (inventoryAdjustment === INVENTORY_ADJUSTMENT.CURRENT_SITE_AND_PROVIDER) {
    return { success: false, message: 'Insufficient inventory and no parent warehouse available' }
  }

  if (site.parentWarehouseId) {
    return findAndTransferInventory({
      originalSiteId,
      currentSiteId: site.parentWarehouseId,
      consumableId,
      quantity,
      expiresOn,
      lotNumber,
      partnerId,
      userId,
      messageContext,
      dataConstraints,
      visitedWarehouses,
      resultId,
      inventoryAdjustment,
      partnerInventoryStrategy,
    })
  }

  return { success: false, message: 'Insufficient inventory and no parent warehouse available' }
}

async function inventoryTransferByRegion({
  site,
  consumableId,
  quantity,
  lotNumber,
  expiresOn,
  siteId,
  partnerId,
  userId,
  resultId,
  inventoryAdjustment,
  partnerInventoryStrategy,
  messageContext,
  dataConstraints,
}) {
  const filters = { lgaId: site.lgaId, stateId: site.stateId, countryId: site.countryId } // Initial filter criteria based on the site's LGA, state, and country ID
  const levels = ['lgaId', 'stateId', 'countryId'] // will remove these levels one by one if we don't find the inventory
  let levelIndex = 0

  while (levelIndex < levels.length) {
    // eslint-disable-next-line no-await-in-loop
    const sites = await getSiteListModifiedQuery({ ...filters, siteTypeName: 'Warehouse' }, dataConstraints)

    for (const regionalSite of sites) {
      // eslint-disable-next-line no-await-in-loop
      const regionalInventoryItem = await findInventoryItem({
        siteId: regionalSite.id,
        consumableId,
        expiresOn,
        lotNumber,
        partnerId,
      })

      if (regionalInventoryItem?.quantityOnHand >= quantity) {
        // eslint-disable-next-line no-await-in-loop
        const transferResponse = await transferInventoryFromSourceToTarget({
          sourceSiteId: regionalSite.id,
          targetSiteId: siteId,
          consumableId,
          quantity,
          lotNumber,
          expiresOn,
          partnerId,
          userId,
          resultId,
          inventoryAdjustment,
          partnerInventoryStrategy,
          messageContext,
        })

        if (transferResponse.success) {
          return { success: true }
        }
      }
    }

    filters[levels[levelIndex]] = null // change the current level to null from the filters and use other remaining levels in filters
    levelIndex += 1
  }

  return { success: false }
}

async function consumeInventoryForResult({
  resultId,
  assayId,
  siteId,
  consumablesInResultData,
  partnerId,
  testStartedOn,
  testEndedOn,
  knex, // <--- means we are inside transaction and should use this `knex`
  messageContext,
  userId,
}) {
  const now = new Date()
  const inventoryStrategy = await getInventoryStrategy({ partnerId })
  const dataConstraints = {
    partner: {
      id: partnerId,
    },
  }
  const { inventoryAdjustment, inventoryStrategy: partnerInventoryStrategy } = await getPartnerByConstraints(
    dataConstraints
  )

  const assayConsumables = await selectAssayConsumables(knex, dataConstraints, assayId)
  const { id: testRunConsumableReasonId } = await findConsumableReason('Test Conducted')

  return Promise.all(
    assayConsumables.map(async assayConsumable => {
      const { consumableId, quantity } = assayConsumable
      const isResultInReconciliation = await knex('MissingInventoryLots as mil')
        .where({
          'mil.resultId': resultId,
        })
        .first()

      const { resultCountInDeviceLog } = await knex('DeviceLog as mil')
        .where({ 'mil.resultId': resultId })
        .count('mil.resultId as resultCountInDeviceLog')
        .first()

      /**
       * Add consumable to site if not exits
       */
      const { includeLocation } = await knex('Consumable').where({ id: consumableId }).first('includeLocation')
      if (includeLocation) {
        await updateSiteConsumable(siteId, { modify: 'add', consumableId }, knex)
      }

      const isUnreconciledResult = isResultInReconciliation && resultCountInDeviceLog > 0

      /**
       * Process inventory based on the following conditions:
       * 1. `isUnreconciledResult`: The result is flagged as unreconciled, requiring inventory processing.
       * 2. `!isResultInReconciliation && resultCountInDeviceLog === 0`:
       *    The result is being processed for the first time (not in missing inventory lots and no prior logs).
       */
      if (isUnreconciledResult || (!isResultInReconciliation && resultCountInDeviceLog === 0)) {
        let expiresOn
        let lotNumber
        if (partnerInventoryStrategy === INVENTORY_STRATEGY.EXPIRATION_DATE) {
          expiresOn = _.get(consumablesInResultData, '[0].expirationDate')
        } else if (partnerInventoryStrategy === INVENTORY_STRATEGY.LOT_NUMBER) {
          lotNumber = _.get(consumablesInResultData, '[0].lot')
        } else {
          expiresOn = _.get(consumablesInResultData, '[0].expirationDate')
          lotNumber = _.get(consumablesInResultData, '[0].lot')
        }

        const inventoryItem = await findInventoryItem({ siteId, consumableId, expiresOn, lotNumber, partnerId })
        const site = await getSite(siteId, dataConstraints)
        if (!inventoryItem || inventoryItem?.quantityOnHand <= 0 || inventoryItem?.quantityOnHand < quantity) {
          const commonPayload = {
            originalSiteId: siteId,
            consumableId,
            quantity,
            expiresOn,
            lotNumber,
            partnerId,
            userId,
            messageContext,
            dataConstraints,
            resultId,
            inventoryAdjustment,
            partnerInventoryStrategy,
          }
          if (inventoryAdjustment === INVENTORY_ADJUSTMENT.CURRENT_SITE_AND_PROVIDER) {
            if (site?.parentWarehouseId) {
              await findAndTransferInventory({
                ...commonPayload,
                currentSiteId: site.parentWarehouseId,
              })
            }
          } else if (inventoryAdjustment === INVENTORY_ADJUSTMENT.CURRENT_SITE_AND_PROVIDER_AND_NATIONAL) {
            let response = { success: false }
            // find by parentWarehouseId
            if (site?.parentWarehouseId) {
              response = await findAndTransferInventory({
                ...commonPayload,
                currentSiteId: site.parentWarehouseId,
              })
            }
            // find by Region
            if (!response.success) {
              response = await inventoryTransferByRegion({
                ...commonPayload,
                site,
                siteId,
              })
            }
          }
        }
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
          partnerId,
          inventoryAdjustment,
          partnerInventoryStrategy,
          messageContext,
          logProps: {
            consumableReasonId: testRunConsumableReasonId,
            adjustedFrom: testStartedOn,
            adjustedTo: testEndedOn,
            operation: 'result',
            resultId,
            effectiveDate: testEndedOn,
          },
          isUnreconciledResult,
          resultId,
        })
      }
    })
  )
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
}
