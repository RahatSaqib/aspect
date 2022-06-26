const { knex } = require('../../db')

const INVENTORY_LOG_LIST = {
  createdOn: 'il.createdOn',
  consumableName: 'c.name',
  lotNumber: 'il.lotNumber',
  expirationDate: 'il.expiresOn',
  siteName: 's.name',
  quantity: knex.raw(
    'CASE WHEN IFNULL(cr.decrease, 0) = 1 THEN -il.quantity ELSE il.quantity END'
  ),
  consumableReason: 'cr.name',
  refSiteName: 'refSite.name',
  movementReason: knex.raw(`
      CASE
        WHEN cr.name = 'Transfer Sent' THEN CONCAT('Transfer sent to ', IFNULL(refSite.name, 'N/A'))
        WHEN cr.name = 'Transfer Received' THEN CONCAT('Received from ', IFNULL(refSite.name, 'N/A'))
        ELSE cr.name
      END`),
  notes: 'il.notes',
  consumableReasonI18nKey: 'cr.i18nKey',
}

const INVENTORY_LOG_UILIST = {
  createdOn: 'il.createdOn',
  consumableName: 'c.name',
  lotNumber: 'il.lotNumber',
  expirationDate: 'il.expiresOn',
  siteName: 's.name',
  quantity: knex.raw(
    'CASE WHEN IFNULL(cr.decrease, 0) = 1 THEN -il.quantity ELSE il.quantity END'
  ),
  consumableReasonI18nKey: 'cr.i18nKey',
  refSiteName: 'refSite.name',
  notes: knex.raw(
    `case when sam.externalId is not null then concat('Sample ID: ', sam.externalId) else il.notes end`
  ),
}

module.exports = {
  INVENTORY_LOG_LIST,
  INVENTORY_LOG_UILIST,
}
