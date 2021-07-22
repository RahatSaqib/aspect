module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const addIssue = require('../common/add_issue')
const { adminUserName, partnerName } = require('./fixtures/partnerData')

async function seed(knex) {
  await Promise.each(
    ['ModuleDisabled', 'DeviceOffline', 'InventoryStockExpiring'],
    externalId =>
      addIssue(knex, externalId, ['admin'], partnerName, adminUserName)
  )
}
