const { addConstraints } = require('../../auth/constraints')
const { knex } = require('../../db')

async function getPartnerByConstraints(dataConstraints) {
  const partner = knex('Partner as p')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .first([
      'name',
      'maxDaysDeviceOffline',
      'maxDaysDeviceNoResults',
      'dueDaysInventoryStockout',
      'dueDaysInventoryStockExpiring',
    ])

  return partner
}

module.exports = { getPartnerByConstraints }
