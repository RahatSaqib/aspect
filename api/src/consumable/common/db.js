const { knex, filterParams, sortPageParams } = require('../../db')

const SELECT_LIST_FIELDS = [
  'c.id',
  'c.name',
  'c.i18nKey',
  'c.strategy',
  'u.name as unit',
  'u.shortName as unitShortName',
  'c.canExpire',
  'c.manufacturer',
  knex.raw('coalesce(pc.autoInclude, 0) as autoInclude'),
  knex.raw(`CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'withlot')>0 THEN TRUE ELSE FALSE END AS showLot`),
  knex.raw(
    `CASE WHEN c.strategy IS NOT NULL AND INSTR(c.strategy,'expirationDate')>0 THEN TRUE ELSE FALSE END AS showExpirationDate`
  ),
  knex.raw(`
    COALESCE((
      SELECT SUM(ii.quantityOnHand)
      FROM InventoryItem AS ii
      WHERE ii.consumableId = c.id
    ), 0) AS quantityOnHand
  `),
  knex.raw('COALESCE(COUNT(DISTINCT sc.siteId), 0) as totalConsumablesTracked'),
]

async function getConsumableTypes(dataConstraints, query) {
  const consumableQuery = knex('Consumable as c')
    .leftJoin('Unit as u', 'c.unit', 'u.id')
    .leftOuterJoin('SiteConsumable as sc', 'c.id', 'sc.consumableId')
    .leftJoin('PartnerConsumable as pc', function () {
      this.on('c.id', 'pc.consumableId').andOn('pc.partnerId', knex.raw(dataConstraints.partner.id))
    })
    .leftJoin('Partner as p', 'pc.partnerId', 'p.id')
    .modify(filterParams, query, { name: 'c.name' })

  const partner = await knex('Partner').where({ id: dataConstraints.partner.id }).first()

  const getCount = consumableQuery.clone().countDistinct('c.id as count').first()

  const getItems = await consumableQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)
    .groupBy('c.id')

  if (partner.inventoryStrategy) {
    // The partner inventory strategy takes precedence over the consumable strategy,
    // so it is being overridden if a partner inventory strategy exists.
    // Since the partner is not directly linked to the consumable,
    // a separate query is required to fetch the partner details and merge them accordingly.
    getItems.forEach(item => {
      item.strategy = partner.inventoryStrategy
    })
  }
  return { getCount, getItems }
}

async function getSiteConsumable(query) {
  const partner = await knex('SiteConsumable as s')
    .modify(filterParams, query, {
      siteId: 's.siteId',
      consumableId: 's.consumableId',
    })
    .first()
  return partner
}
module.exports = {
  getConsumableTypes,
  getSiteConsumable,
}
