module.exports = require('../../utils').seed(seed, __filename)

const { partnerName } = require('./fixtures/partnerVariables.json')

async function seed(knex) {
  await knex('Partner')
    .where('name', partnerName)
    .update({ plugin: 'lesothoTb' })
}
