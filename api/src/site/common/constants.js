const { knex } = require('../../db')

const SELECT_LIST_FIELDS = [
  's.id',
  's.name',
  's.shortName',
  'sta.name as state',
  'st.name as siteType',
  'spw.name as parentWarehouseName',
  'l.name as lga',
  's.createdOn',
  's.externalId',
  's.parentWarehouseId',
  knex.raw('MAX(ii.updatedOn) as inventoryUpdatedOn'),
  knex.raw('COALESCE(COUNT(DISTINCT sc.consumableId), 0) as siteConsumableCount'),
]

const SITE_FIELDS = [
  's.id',
  's.name',
  's.shortName',
  's.externalId',
  's.timezoneId as timezone',
  's.city',
  's.zip',
  's.street1',
  's.street2',
  's.longitude',
  's.latitude',
  's.geographyId',
  's.siteTypeId',
  's.hoursStart',
  's.hoursEnd',
  's.notes',
  's.parentWarehouseId',
  's.hoursStart',
  's.hoursEnd',
  's.createdOn',
  's.sampleRegistrationAllowed',
]

const SELECT_SHOW_FIELDS = [
  'sta.name as state',
  'l.name as lga',
  'ct.name as country',
  'g.countryId',
  'g.stateId',
  'g.lgaId',
  ...SITE_FIELDS,
]

module.exports = {
  SELECT_LIST_FIELDS,
  SITE_FIELDS,
  SELECT_SHOW_FIELDS,
}
