const _ = require('lodash')
const subDays = require('date-fns/subDays')

const { getDateTimeProjectionInTimeZoneIANA } = require(`../shared/date`)
const { getConstraints } = require('../auth/constraints')
const { knex, filterDateRangeParams, filterParams, sortPageParams } = require('../db')
const { getInventoryLogBaseQuery, getConsumableStrategy } = require('./common/db')
const { getUserFromCredentials } = require('../auth/constraints')

async function listInventoryLog(request) {
  const { auth, query } = request
  const user = await getUserFromCredentials(auth.credentials)
  const { timezoneIANA: timeZoneIANA } = user

  const dataConstraints = await getConstraints(auth.credentials)

  const { total, data } = await getInventoryLog(query, dataConstraints, timeZoneIANA)

  return { ok: true, total, length: data.length, data }
}

async function getInventoryLog(requestQuery, dataConstraints, timeZoneIANA) {
  if (_.isNil(requestQuery.maxDate)) {
    requestQuery.maxDate = new Date()
  }
  if (_.isNil(requestQuery.minDate)) {
    requestQuery.minDate = subDays(new Date(requestQuery.maxDate), 30).toISOString()
  }

  const partnerId = dataConstraints.partner.id
  const consumableStrategy = await getConsumableStrategy(partnerId)
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
      if (requestQuery.onlyTransfers) queryBuilder.whereIn('cr.externalId', ['transfer_received', 'transfer_sent'])
    })
    .modify(queryBuilder => {
      if (requestQuery.siteIds) {
        queryBuilder.whereIn('s.id', requestQuery.siteIds.split(','))
      }
    })
  const querySelector = getInventoryLogListProjection(knex, timeZoneIANA, consumableStrategy)
  const ilogQuery = knex
    .from(inventoryLogQuery.select(querySelector).as('ilog'))
    .select([
      'createdOn',
      'assayId',
      'consumableName',
      'consumableNameI18nKey',
      ...consumableStrategy.filterFields({
        lotNumberField: 'lotNumber',
        expiresOnField: 'expiresOn as expirationDate',
      }),
      'siteName',
      knex.raw('sum(ilog.quantity) as quantity'),
      knex.raw('ilog.quantityOnHandAfter'),
      'movementReason',
      knex.raw('first_value(ilog.notes) over (partition by ilog.id order by ilog.createdOn) as notes'),
      'refSiteName',
      'consumableReason',
      'consumableReasonI18nKey',
      'consumableReasonExternalId',
      'consumableReasonEffectOnStock',
      'transactionDate',
      knex.raw('max(resultEndedOn) as resultEndedOn'),
    ])
    .groupBy([
      'createdOn',
      'consumableName',
      'assayId',
      'consumableNameI18nKey',
      ...consumableStrategy.filterFields({
        lotNumberField: 'lotNumber',
        expiresOnField: 'expiresOn',
      }),
      'siteName',
      'consumableReason',
      'refSiteName',
      'movementReason',
      'consumableReasonI18nKey',
      'consumableReasonExternalId',
      'transactionDate',
    ])

  const { total } = await knex.from(ilogQuery.clone().as('q')).count('* as total').first()

  const INVENTORY_LOG_SORT_FIELDS = [
    'consumableName',
    'siteName',
    'countryName',
    'stateName',
    'lgaName',
    'quantityOnHand',
    ...consumableStrategy.filterFields({
      lotNumberField: 'lotNumber',
      expiresOnField: 'expiresOn',
    }),
    'movementReason',
    'transactionDate',
  ]
  ilogQuery.modify(sortPageParams, requestQuery, 'iLog.createdOn', INVENTORY_LOG_SORT_FIELDS)

  const data = await ilogQuery
  return { data, total }
}

function getInventoryLogListProjection(knex, timeZoneIANA, consumableStrategy) {
  const createdOnProjection = getDateTimeProjectionInTimeZoneIANA(knex, 'il.createdOn', timeZoneIANA)
  const transactionDateProjection = getDateTimeProjectionInTimeZoneIANA(knex, 'il.transactionDate', timeZoneIANA)

  return [
    'il.id as id',
    'c.name as consumableName',
    'ca.assayId as assayId',
    'c.i18nKey as consumableNameI18nKey',
    ...consumableStrategy.filterFields({
      lotNumberField: 'il.lotNumber as lotNumber',
      expiresOnField: 'il.expiresOn',
    }),
    's.name as siteName',
    'cr.name as consumableReason',
    'refSite.name as refSiteName',
    'il.quantity as quantity',
    'il.quantityOnHandAfter as quantityOnHandAfter',
    knex.raw(`
      CASE
        WHEN cr.externalId = 'transfer_sent' THEN CONCAT('Transfer sent to ', IFNULL(refSite.name, 'N/A'))
        WHEN cr.externalId = 'transfer_received' THEN CONCAT('Received from ', IFNULL(refSite.name, 'N/A'))
        ELSE cr.name
      END as movementReason
    `),
    'il.notes as notes',
    'cr.i18nKey as consumableReasonI18nKey',
    'cr.externalId as consumableReasonExternalId',
    'cr.effectOnStock as consumableReasonEffectOnStock',
    knex.raw(
      `CASE WHEN cr.externalId = 'test_conducted' THEN date(${createdOnProjection}) ELSE ${createdOnProjection} END as createdOn`
    ),
    knex.raw(
      `CASE WHEN cr.externalId = 'test_conducted' THEN date(${transactionDateProjection}) ELSE ${transactionDateProjection} END as transactionDate`
    ),
    'r.endedOn as resultEndedOn',
  ]
}

module.exports = listInventoryLog
