const _ = require('lodash')
const subDays = require('date-fns/subDays')

const { getDateTimeProjectionInTimeZoneIANA, getDateTimeExpressionInTimeZone } = require(`../shared/date`)
const { getConstraints } = require('../auth/constraints')
const { knex, filterDateRangeParams, filterParams, sortPageParams } = require('../db')
const { getInventoryLogBaseQuery } = require('./common/db')
const { getUserFromCredentials } = require('../auth/constraints')

async function listInventoryLog(request) {
  const { auth, query } = request
  const user = await getUserFromCredentials(auth.credentials)
  const { timezoneIANA: timeZoneIANA } = user

  const dataConstraints = await getConstraints(auth.credentials)
  const { total, data } = await getInventoryLog(
    query,
    dataConstraints,
    getInventoryLogListProjection(knex, timeZoneIANA)
  )

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

  const ilogQuery = knex
    .from(inventoryLogQuery.select(querySelector).as('ilog'))
    .select([
      'createdOn',
      'consumableName',
      'assayId',
      'consumableNameI18nKey',
      'lotNumber',
      'expirationDate',
      'siteName',
      knex.raw('sum(CASE WHEN IFNULL(ilog.decrease, 0) = 1 THEN -ilog.quantity ELSE ilog.quantity END) as quantity'),
      'movementReason',
      knex.raw('first_value(ilog.notes) over (partition by ilog.id order by ilog.createdOn) as notes'),
      'consumableReason',
      'refSiteName',
      'movementReason',
      'consumableReasonI18nKey',
      'consumableReasonExternalId',
      'transactionDate',
      knex.raw('max(resultEndedOn) as resultEndedOn'),
    ])
    .groupBy([
      'createdOn',
      'consumableName',
      'assayId',
      'consumableNameI18nKey',
      'lotNumber',
      'expirationDate',
      'siteName',
      'movementReason',
      'consumableReason',
      'refSiteName',
      'movementReason',
      'consumableReasonI18nKey',
      'consumableReasonExternalId',
      'transactionDate',
    ])

  const { total } = await ilogQuery.clone().count('* as total').first()

  ilogQuery.modify(sortPageParams, requestQuery, 'il.createdOn', INVENTORY_LOG_SORT_FIELDS)

  const data = await ilogQuery
  return { data, total }
}

function getInventoryLogListProjection(knex, timeZoneIANA) {
  return {
    id: 'il.id',
    createdOn: knex.raw(`${getDateTimeProjectionInTimeZoneIANA(knex, 'il.createdOn', timeZoneIANA)}`),
    consumableName: 'c.name',
    assayId: 'ca.assayId',
    consumableNameI18nKey: 'c.i18nKey',
    lotNumber: 'il.lotNumber',
    expirationDate: 'il.expiresOn',
    decrease: 'cr.decrease',
    siteName: 's.name',
    consumableReason: 'cr.name',
    refSiteName: 'refSite.name',
    quantity: 'il.quantity',
    movementReason: knex.raw(`
      CASE
        WHEN cr.name = 'Transfer Sent' THEN CONCAT('Transfer sent to ', IFNULL(refSite.name, 'N/A'))
        WHEN cr.name = 'Transfer Received' THEN CONCAT('Received from ', IFNULL(refSite.name, 'N/A'))
        ELSE cr.name
      END`),
    notes: 'il.notes',
    consumableReasonI18nKey: 'cr.i18nKey',
    consumableReasonExternalId: 'cr.externalId',
    transactionDate: getDateTimeExpressionInTimeZone(knex, 'il.adjustedFrom', timeZoneIANA),
    resultEndedOn: 'r.endedOn',
  }
}

const INVENTORY_LOG_SORT_FIELDS = [
  'consumableName',
  'siteName',
  'countryName',
  'stateName',
  'lgaName',
  'quantityOnHand',
  'expiresOn',
  'lotNumber',
  'movementReason',
  'transactionDate',
]

module.exports = listInventoryLog
