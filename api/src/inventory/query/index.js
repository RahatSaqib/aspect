const { addConstraints } = require('../../auth/constraints')
const querySelectors = require('../common/queryConstants')

const getInventoryLogBaseQuery = (knex, dataConstraints) =>
  knex('InventoryLog as il')
    .innerJoin('Consumable as c', 'il.consumableId', 'c.id')
    .innerJoin('Site as s', 'il.siteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('ConsumableReason as cr', 'il.consumableReasonId', 'cr.id')
    .leftJoin('Result as r', 'il.resultId', 'r.id')
    .leftJoin('Site as refSite', 'il.referencedSiteId', 'refSite.id')
    .leftJoin('Sample as sam', 'r.sampleId', 'sam.id')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
    })

module.exports = {
  getInventoryLogBaseQuery,
  querySelectors,
}
