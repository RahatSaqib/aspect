const { seed } = require('../utils')

module.exports = seed(async knex => {
  await knex('IssueType as it')
    .whereIn('it.externalId', [
      'ModuleDisabled',
      'ModuleReplaced',
      'DeviceOffline',
      'DeviceNoResults',
      'InventoryStockExpiring',
      'SiteWithLowFieldCompletionRate',
    ])
    .update({
      'it.readyForNotification': true,
    })
}, __filename)
