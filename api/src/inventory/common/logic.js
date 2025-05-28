const { consumableReasonById, consumableReasonToId } = require('../../shared/dictionary')
const { resolveIssues, escalateIssues } = require('../../issue/actions')
const { inventoryStockout, inventoryStockExpiring } = require('../actions')
const { auditInventoryStockout, auditInventoryStockExpiring } = require('../../shared/utilsInventory')
const { findInventoryItem, getInventoryItem, createInventoryTransfer, updateInventoryTransfer } = require('./db')
const { INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY } = require('./querySelectors')
const { parseDateOrDefault } = require('../../shared/date')

/**
 * when inventory is being transferred - do it in 2 steps:
 * - process `transferInventory` and set `inTransitFromSiteId` for inventory for `toSiteId`
 * - process `receiveInventory` and update both `fromSite` and `toSite` and release `inTransitFromSiteId`
 */
const transferInPendingMode = false

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
  reconciliationStartDate,
}) {
  const updateData = {
    quantityOnHand,
    inTransitFromSiteId: inTransitFromSiteId || null,
    updatedOn: now,
    updatedBy: userId,
  }
  if (reconciliationStartDate) {
    updateData.reconciliationStartDate = reconciliationStartDate
  }
  if (inventoryItemId) {
    await knex('InventoryItem')
      .where('id', inventoryItemId)
      .update({ ...updateData, updatedOn: new Date() })
  } else if (quantityOnHand > 0) {
    const insertData = {
      ...updateData,
      consumableId,
      siteId,
      lotNumber,
      expiresOn: parseDateOrDefault(expiresOn) || null,
      createdOn: now,
      createdBy: userId,
    }
    ;[inventoryItemId] = await knex('InventoryItem').insert(insertData)
  }
  return inventoryItemId
}

async function validateAndDetermineNewQuantity({ inventoryItem, consumableReasonId, transactionDate, quantity }) {
  const validation = validateOperation({ inventoryItem, transactionDate })
  if (!validation.ok) return validation

  const { effectOnStock } = await consumableReasonById(consumableReasonId)
  const initialQuantity = inventoryItem?.quantityOnHand || 0

  switch (effectOnStock) {
    case 'increase':
      return { ok: true, quantityOnHand: initialQuantity + quantity, quantityToLog: quantity }
    case 'decrease': {
      const validation = validateDecreaseOperation(inventoryItem, quantity)
      if (!validation.ok) return validation
      return { ok: true, quantityOnHand: initialQuantity - quantity, quantityToLog: -quantity }
    }
    case 'resetToValue':
      return { ok: true, quantityOnHand: quantity, quantityToLog: quantity - initialQuantity }
    default:
      return { ok: false, error: 'invalidEffectOnStock', errorMessage: `Invalid effectOnStock: ${effectOnStock}` }
  }
}

function validateDecreaseOperation(inventoryItem, quantity) {
  if (!inventoryItem) {
    return { ok: false, error: 'missingInventoryItem', errorMessage: 'Cannot deduct from non-existent inventory item' }
  }

  if (inventoryItem.quantityOnHand < 0) {
    return {
      ok: false,
      error: 'negativeQuantity',
      errorMessage: `quantityOnHand is negative (${inventoryItem.quantityOnHand}) for inventoryItemId=${inventoryItem.id}`,
    }
  }

  if (inventoryItem.quantityOnHand < quantity) {
    return {
      ok: false,
      error: 'notEnoughInventory',
      errorMessage: `Not enough inventory (${inventoryItem.quantityOnHand}) to remove ${quantity} items`,
    }
  }

  return { ok: true }
}

function validateOperation({ inventoryItem, transactionDate }) {
  if (
    inventoryItem &&
    inventoryItem.reconciliationStartDate &&
    inventoryItem.reconciliationStartDate > transactionDate
  ) {
    return {
      ok: false,
      error: 'reconciliationDateViolation',
      errorMessage: `Transaction date is before the reconciliation start date (${inventoryItem.reconciliationStartDate}).`,
    }
  }

  return { ok: true }
}

// ----------------------------------------------------------------------------------
async function upsertInventoryItemAndLog(
  knex,
  {
    inventoryItemId,
    quantityOnHand,
    quantityToLog,
    inventoryAdjustment,
    partnerInventoryStrategy,
    siteId,
    consumableId,
    consumableReasonId,
    lotNumber,
    expiresOn,
    inTransitFromSiteId,
    now,
    userId,
    transactionDate,
    notes,
    resultId,
    referencedSiteId,
  }
) {
  const { effectOnStock } = await consumableReasonById(consumableReasonId)

  inventoryItemId = await upsertInventoryItem({
    knex,
    inventoryItemId,
    quantityOnHand,
    siteId,
    consumableId,
    lotNumber,
    expiresOn,
    inTransitFromSiteId,
    reconciliationStartDate: effectOnStock === 'resetToValue' ? now : null,
    now,
    userId,
  })
  const [inventoryLogId] = await knex('InventoryLog').insert({
    inventoryItemId,
    consumableId,
    consumableReasonId,
    siteId,
    lotNumber,
    expiresOn: parseDateOrDefault(expiresOn) || null,
    adjustmentStrategy: inventoryAdjustment,
    consumableStrategy: partnerInventoryStrategy,
    createdOn: now,
    createdBy: userId,
    transactionDate,
    notes,
    resultId,
    quantity: quantityToLog,
    referencedSiteId,
    quantityOnHandAfter: quantityOnHand,
  })

  return { inventoryItemId, inventoryLogId }
}

async function changeInventoryQuantity(knex, params) {
  const {
    consumableId,
    siteId,
    lotNumber,
    expiresOn,
    quantity,
    inTransitFromSiteId,
    now,
    userId,
    inventoryAdjustment,
    partnerId,
    partnerInventoryStrategy,
    consumableReasonId,
    transactionDate,
    notes,
    resultId,
    plugins,
    messageContext,
  } = params

  const inventoryItem = await findInventoryItem(knex, {
    siteId,
    consumableId,
    expiresOn,
    lotNumber,
    partnerId,
    resultId,
  })

  const res = await validateAndDetermineNewQuantity({ inventoryItem, consumableReasonId, transactionDate, quantity })
  if (!res.ok) {
    return res
  }

  const result = await upsertInventoryItemAndLog(knex, {
    inventoryItemId: inventoryItem?.id,
    quantityOnHand: res.quantityOnHand,
    quantityToLog: res.quantityToLog,
    siteId: inventoryItem?.siteId ?? siteId,
    consumableId,
    consumableReasonId,
    lotNumber,
    ...(resultId && { inventoryAdjustment, partnerInventoryStrategy }),
    expiresOn,
    inTransitFromSiteId,
    now,
    userId,
    transactionDate,
    notes,
    resultId,
  })

  /**
   * run needed MQ tasks after changing inventory quantity
   * Notice that we here run all MQ tasks AFTER changing inventory - to make
   * sure that MQ handler for sure is dealing with already committed
   * above transactions
   */
  if (messageContext) {
    await checkOpenedStockIssues({
      knex,
      siteId,
      consumableId,
      now,
      plugins,
      messageContext,
    })
  }
  return { ok: true, ...result }
}

async function transferInventory(knex, { payload, messageContext, partnerId, userId }) {
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
    force,
    inventoryAdjustment,
    partnerInventoryStrategy,
  } = payload

  messageContext = messageContext?.bindActionCreators({
    inventoryStockout,
    inventoryStockExpiring,
    resolveIssues,
    escalateIssues,
  })

  const shouldTransferInPendingMode = transferInPendingMode && force !== true
  const sourceInventoryItem = await findInventoryItem(knex, {
    siteId: fromSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    partnerId,
  })
  const source = await validateAndDetermineNewQuantity({
    inventoryItem: sourceInventoryItem,
    consumableReasonId: await consumableReasonToId('transfer_sent'),
    transactionDate: dateAdjusted,
    quantity,
  })
  if (!source.ok) {
    return source
  }

  const destinationInventoryItem = await findInventoryItem(knex, {
    siteId: toSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    inTransitFromSiteId: transferInPendingMode ? fromSiteId : null,
    partnerId,
  })
  const destination = await validateAndDetermineNewQuantity({
    inventoryItem: destinationInventoryItem,
    consumableReasonId: await consumableReasonToId('transfer_received'),
    transactionDate: dateAdjusted,
    quantity,
  })
  if (!destination.ok) {
    return destination
  }

  const now = new Date()

  const transferReceivedConsumableReasonId = await consumableReasonToId('transfer_received')
  const { inventoryItemId: destinationInventoryItemId, inventoryLogId: destinationInventoryLogId } =
    await upsertInventoryItemAndLog(knex, {
      inventoryItemId: destinationInventoryItem?.id,
      quantityOnHand: destination.quantityOnHand,
      quantityToLog: destination.quantityToLog,
      siteId: toSiteId,
      consumableId,
      consumableReasonId: transferReceivedConsumableReasonId,
      lotNumber,
      expiresOn,
      inTransitFromSiteId: shouldTransferInPendingMode ? fromSiteId : null,
      now,
      userId,
      transactionDate: dateAdjusted,
      notes,
      resultId,
      inventoryAdjustment,
      partnerInventoryStrategy,
      referencedSiteId: fromSiteId,
    })

  const transferSentConsumableReasonId = await consumableReasonToId('transfer_sent')
  const { inventoryItemId: sourceInventoryItemId, inventoryLogId: sourceInventoryLogId } =
    await upsertInventoryItemAndLog(knex, {
      inventoryItemId: sourceInventoryItem?.id,
      quantityOnHand: source.quantityOnHand,
      quantityToLog: source.quantityToLog,
      siteId: fromSiteId,
      consumableId,
      consumableReasonId: transferSentConsumableReasonId,
      lotNumber,
      expiresOn,
      now,
      userId,
      transactionDate: dateAdjusted,
      notes,
      resultId,
      inventoryAdjustment,
      partnerInventoryStrategy,
      referencedSiteId: toSiteId,
    })

  await createInventoryTransfer(knex, sourceInventoryLogId, destinationInventoryItemId)
  if (!shouldTransferInPendingMode) {
    await updateInventoryTransfer(knex, destinationInventoryItemId, destinationInventoryLogId)
  }
  if (messageContext) {
    const props = {
      knex,
      consumableId,
      now,
      messageContext,
    }
    await checkOpenedStockIssues({ ...props, siteId: fromSiteId })
    await checkOpenedStockIssues({ ...props, siteId: toSiteId })
  }

  return {
    ok: true,
    existingInventoryItem: await getInventoryItem(sourceInventoryItemId, INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY),
    newInventoryItem: await getInventoryItem(destinationInventoryItemId, INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY),
  }
}

async function checkOpenedStockIssues({ knex, siteId, consumableId, now, plugins, messageContext }) {
  // same query as in onFactCheckInventoryStock() in /src/inventory/service.js, but with additional 'where' for ii.siteId and ii.consumableId
  // this is just for getting dueDaysInventoryStockout and dueDaysInventoryStockExpiring values
  const [site] = await knex('InventoryItem as ii')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .innerJoin('Partner as p', 's.partnerId', 'p.id')
    .where('ii.siteId', siteId)
    .where('ii.consumableId', consumableId)
    .where(function () {
      this.whereNull('ii.expiresOn').orWhere('ii.expiresOn', '>', now)
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
  transferInPendingMode,
  transferInventory,
  upsertInventoryItem,
  changeInventoryQuantity,
  validateAndDetermineNewQuantity,
  upsertInventoryItemAndLog,
}
