const { updateCustomFields } = require('../utils')
const { partnerName } = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first('id')

  await updateCustomFields(
    knex,
    partnerId,
    'CustomFieldsTB_Bangladesh.json',
    'CustomFieldsTB',
    ['CustomFieldsExample']
  )
}

module.exports = require('../utils').seed(seed, __filename)
