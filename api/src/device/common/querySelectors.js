const { knex } = require('../../db')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')

function getSelectListFields(timeZoneIANA, { lastSeenField } = {}) {
  return [
    ...SELECT_LIST_FIELDS,
    getDateTimeProjectionInTimeZoneIANA(knex, 'd.createdOn', timeZoneIANA, 'createdOn'),
    getDateTimeProjectionInTimeZoneIANA(knex, 'd.lastPingOn', timeZoneIANA, 'lastPingOn'),
    getDateTimeProjectionInTimeZoneIANA(knex, lastSeenField ?? 'd.lastSeenOn', timeZoneIANA, 'lastSeen'),
  ]
}

const SELECT_LIST_FIELDS = [
  'd.id',
  'd.name',
  'd.shortName',
  'st.name as state',
  'dt.name as type',
  's.name as siteName',
  knex.raw("CASE WHEN da.token = 'approved' AND ISNULL(dms.name) = 0 THEN dms.name ELSE da.name END as status"),
  knex.raw(
    "CASE WHEN da.token = 'approved' AND ISNULL(dms.i18nKey) = 0 THEN dms.i18nKey ELSE da.i18nKey END as statusI18nKey"
  ),
  'da.name as approval',
  knex.raw(
    'CASE WHEN dmsl.day >= DATE(DATE_ADD(now(), INTERVAL -1 DAY)) THEN dms.externalId ELSE null END maintenanceStatus'
  ),
  knex.raw(`
  CASE 
    WHEN dmsl.day >= DATE(DATE_ADD(NOW(), INTERVAL -1 DAY)) THEN
      CASE 
        WHEN deviceResult.totalCurrentDay = 0 AND dms.externalId = 'active' THEN 'inactiveUnknown'
        ELSE dms.i18nKey 
      END
    ELSE NULL
  END AS maintenanceStatusI18nKey`),
  'da.i18nKey as approvalStatusI18nKey',
  knex.raw(
    'CASE WHEN dmsl.day >= DATE(DATE_ADD(now(), INTERVAL -1 DAY)) THEN dms.name ELSE null END as maintenanceStatusName'
  ),
  knex.raw(
    'CASE WHEN dmsl.day >= DATE(DATE_ADD(now(), INTERVAL -1 DAY)) THEN dms.active ELSE null END as maintenanceStatusActive'
  ),
  knex.raw(
    'CASE WHEN dmsl.day >= DATE(DATE_ADD(now(), INTERVAL -1 DAY)) THEN dms.manuallySet ELSE null END as maintenanceStatusManuallySet'
  ),
  'dc.name as category',
  'dc.hasResults',
  'dc.hasConnectivity',
]

module.exports = {
  getSelectListFields,
}
