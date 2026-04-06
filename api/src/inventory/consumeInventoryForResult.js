const { getSite } = require('../site/service')
const { INVENTORY_ADJUSTMENT } = require('../shared/constants')
const { updateSiteConsumable } = require('../site/common/db')
const { getPartnerByConstraints } = require('../partner/common/db')
const { selectAssayConsumables } = require('../consumable/assayConsumableService')
const { consumableToIncludeLocation, consumableReasonToId } = require('../shared/dictionary')

const { findInventoryItem } = require('./common/db')
const { changeInventoryQuantity, transferInventory } = require('./common/logic')

async function consumeInventoryForResult({
  knex,
  resultId,
  assayId,
  siteId,
  lotNumber,
  expirationDate: expiresOn,
  partnerId,
  testStartedOn,
  messageContext,
}) {
  const now = new Date()
  const dataConstraints = {
    partner: {
      id: partnerId,
    },
  }
  const { inventoryAdjustment, inventoryStrategy: partnerInventoryStrategy } = await getPartnerByConstraints(
    dataConstraints
  )

  const assayConsumables = await selectAssayConsumables(knex, dataConstraints, assayId)
  const testConductedConsumableReasonId = await consumableReasonToId('test_conducted')

  const { isUnreconciledResult } = await knex('Result')
    .whereNull('reconciliationDate')
    .where('id', resultId)
    .count('id as isUnreconciledResult')
    .first()

  return Promise.all(
    assayConsumables.map(async assayConsumable => {
      const { consumableId, consumableExternalId, quantity } = assayConsumable

      /**
       * Add consumable to site if not exits
       */
      const includeLocation = await consumableToIncludeLocation(consumableExternalId)
      if (includeLocation) {
        await updateSiteConsumable(knex, siteId, { modify: 'add', consumableId })
      }

      /**
       * The result is flagged as unreconciled, requiring inventory processing.
       */
      if (isUnreconciledResult) {
        const inventoryItem = await findInventoryItem(knex, { siteId, consumableId, expiresOn, lotNumber, partnerId })
        const site = await getSite(siteId, dataConstraints)
        if (!inventoryItem || inventoryItem?.quantityOnHand <= 0 || inventoryItem?.quantityOnHand < quantity) {
          const commonPayload = {
            originalSiteId: siteId,
            consumableId,
            quantity,
            expiresOn,
            lotNumber,
            partnerId,
            messageContext,
            dataConstraints,
            resultId,
            inventoryAdjustment,
            partnerInventoryStrategy,
          }
          if (inventoryAdjustment === INVENTORY_ADJUSTMENT.CURRENT_SITE_AND_PROVIDER) {
            if (site?.parentWarehouseId) {
              await findAndTransferInventory(knex, {
                ...commonPayload,
                currentSiteId: site.parentWarehouseId,
              })
            }
          } else if (inventoryAdjustment === INVENTORY_ADJUSTMENT.CURRENT_SITE_AND_PROVIDER_AND_NATIONAL) {
            // find by parentWarehouseId
            if (site?.parentWarehouseId) {
              await findAndTransferInventory(knex, {
                ...commonPayload,
                currentSiteId: site.parentWarehouseId,
              })
            }
          }
        }

        const res = await changeInventoryQuantity(knex, {
          consumableId,
          siteId,
          lotNumber,
          expiresOn,
          quantity,
          now,
          partnerId,
          inventoryAdjustment,
          partnerInventoryStrategy,
          messageContext,
          consumableReasonId: testConductedConsumableReasonId,
          transactionDate: testStartedOn,
          resultId,
        })

        if (res.ok) {
          await knex('Result').where('id', resultId).update({
            reconciliationDate: new Date(),
          })
        }

        return res
      }
    })
  )
}

// Recursive function to find inventory and transfer if available
async function findAndTransferInventory(
  knex,
  {
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
  }
) {
  // If the current site has already been visited, return to avoid circular dependency
  if (visitedWarehouses.has(currentSiteId)) {
    return { ok: false, errorMessage: 'Circular dependency detected in warehouse hierarchy' }
  }

  visitedWarehouses.add(currentSiteId)

  const site = await getSite(currentSiteId, dataConstraints)

  const inventoryItem = await findInventoryItem(knex, {
    siteId: currentSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    partnerId,
  })

  if (inventoryItem?.quantityOnHand >= quantity) {
    if (currentSiteId !== originalSiteId) {
      const payload = {
        dateAdjusted: new Date(),
        quantity,
        lotNumber,
        toSiteId: originalSiteId,
        fromSiteId: currentSiteId,
        expiresOn,
        consumableId,
        force: true,
        inventoryAdjustment,
        partnerInventoryStrategy,
      }

      return transferInventory(knex, { payload, partnerId, userId, messageContext })
    }
    return { ok: true }
  }

  //  based on the adjustment type, terminate the recursion
  if (inventoryAdjustment === INVENTORY_ADJUSTMENT.CURRENT_SITE_AND_PROVIDER) {
    return { ok: false, errorMessage: 'Insufficient inventory and no parent warehouse available' }
  }

  if (site.parentWarehouseId) {
    return findAndTransferInventory(knex, {
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

  return { ok: false, errorMessage: 'Insufficient inventory and no parent warehouse available' }
}

module.exports = { consumeInventoryForResult }
