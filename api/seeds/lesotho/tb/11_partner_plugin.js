module.exports = require('../../utils').seed(seed, __filename)

const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

async function seed(knex) {
  await knex('Partner').where('externalId', partnerExternalId).update({ plugin: 'lesothoTb' })
}
