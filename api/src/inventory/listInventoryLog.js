const _ = require('lodash')
const subDays = require('date-fns/subDays')
const { getDateTimeProjectionInTimeZoneIANA } = require(`../shared/date`)
const { getConstraints } = require('../auth/constraints')
const { knex, filterDateRangeParams, filterParams, sortPageParams } = require('../db')
const { getInventoryLogBaseQuery } = require('./common/db')
const { getUserFromCredentials } = require('../auth/constraints')

async function listInventoryLog(request) {
  const { auth, query } = request
  const user = await getUserFromCredentials(auth.credentials)
  const { timeZoneIANA } = user

  const dataConstraints = await getConstraints(auth.credentials)
  const { total, data } = await getInventoryLog(query, dataConstraints, getInventoryLogListProjection(knex, timeZoneIANA))

  return { ok: true, total, length: data.length, data }
}

async function getInventoryLog(requestQuery, dataConstraints, querySelector) {
  if (_.isNil(requestQuery.maxDate)) {
    requestQuery.maxDate = new Date()
  }
  if (_.isNil(requestQuery.minDate)) {
    requestQuery.minDate = subDays(new Date(requestQuery.maxDate), 30).toISOString()
  }

  const inventoryLogQuery = getInventoryLogBaseQuery(knex, dataConstraints)
    .modify(filterDateRangeParams, requestQuery, 'il.createdOn')
    .modify(
      filterDateRangeParams,
      { minDate: requestQuery.minExpirationDate, maxDate: requestQuery.maxExpirationDate },
      'il.expiresOn'
    )
    .modify(filterParams, requestQuery, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      consumableId: 'c.id',
      consumableExternalId: 'c.externalId',
      siteName: 's.name',
      siteId: 's.id',
      lotNumber: 'il.lotNumber',
    })
    .modify(queryBuilder => {
      if (requestQuery.onlyTransfers)
        queryBuilder.whereIn('cr.i18nKey', ['ConsumableReason_TransferReceived', 'ConsumableReason_TransferSent'])
    })
    .modify(queryBuilder => {
      if (requestQuery.siteIds) {
        queryBuilder.whereIn('s.id', requestQuery.siteIds.split(','))
      }
    })
  // .groupBy('createdOn')
  const { total } = await inventoryLogQuery.clone().count('il.id as total').first()

  const data = await inventoryLogQuery
    .select(querySelector)
    .modify(sortPageParams, requestQuery, 'il.createdOn', INVENTORY_LOG_SORT_FIELDS)
  return { data, total }
}

function getInventoryLogListProjection(knex, timeZoneIANA) {
  return {
    createdOn: knex.raw(`min(${getDateTimeProjectionInTimeZoneIANA(knex, 'il.createdOn', timeZoneIANA)})`),
    consumableName: 'c.name',
    assayId: 'ca.assayId',
    consumableNameI18nKey: 'c.i18nKey',
    lotNumber: 'il.lotNumber',
    expirationDate: 'il.expiresOn',
    siteName: 's.name',
    quantity: knex.raw('CASE WHEN IFNULL(cr.decrease, 0) = 1 THEN -il.quantity ELSE sum(il.quantity) END'),
    consumableReason: 'cr.name',
    refSiteName: 'refSite.name',
    movementReason: knex.raw(`
      CASE
        WHEN cr.name = 'Transfer Sent' THEN CONCAT('Transfer sent to ', IFNULL(refSite.name, 'N/A'))
        WHEN cr.name = 'Transfer Received' THEN CONCAT('Received from ', IFNULL(refSite.name, 'N/A'))
        ELSE cr.name
      END`),
    notes: knex.raw(
      `case when sam.externalId is not null then concat('Sample ID: ', sam.externalId) else il.notes end`
    ),
    consumableReasonI18nKey: 'cr.i18nKey',
    consumableReasonExternalId: 'cr.externalId',
    transactionDate: 'il.adjustedFrom',
    resultEndedOn: 'r.endedOn',
  }
}

const INVENTORY_LOG_SORT_FIELDS = {
  consumableName: 'c.name',
  siteName: 's.name',
  countryName: 'co.name',
  stateName: 'st.name',
  lgaName: 'l.name',
  quantityOnHand: 'il.quantity',
  expiresOn: 'il.expiresOn',
  lotNumber: 'il.lotNumber',
  movementReason: knex.raw(`
  CASE
    WHEN cr.name = 'Transfer Sent' THEN CONCAT('Transfer sent to ', IFNULL(refSite.name, 'N/A'))
    WHEN cr.name = 'Transfer Received' THEN CONCAT('Received from ', IFNULL(refSite.name, 'N/A'))
    ELSE cr.name
  END`),
  transactionDate: 'il.adjustedFrom',
}

module.exports = listInventoryLog
