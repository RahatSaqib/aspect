module.exports = require('../utils').seed(seed)

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where('name', 'Myanmar')
    .first('id')

  const myanmarConsumableIssues = await knex('IssueCategory as ic')
    .join('IssueType as it', 'ic.id', 'it.issueCategoryId')
    .join('Issue as i', 'it.id', 'i.issueTypeId')
    .where(function() {
      this.whereNull('i.consumableId')
        .andWhere('i.partnerId', partnerId)
        .andWhere('ic.name', 'Reagent Health')
    })
    .pluck('i.id')

  const { id: consumableIdTb } = await knex('Consumable')
    .where('name', 'GeneXpert TB Cartridge')
    .first('id')

  await knex('Issue')
    .whereIn('id', myanmarConsumableIssues)
    .update({ consumableId: consumableIdTb })

  await knex('Partner')
    .where('id', partnerId)
    .update({
      partnerSettings: JSON.stringify({
        'dashboard.action.allowStockUpdateForConsumableIds': [consumableIdTb],
      }),
    })
}
