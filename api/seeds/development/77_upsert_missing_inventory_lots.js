module.exports = require('../utils').seed(seed, __filename)

const { adminName } = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where('name', 'Partner One').first()
  const { id: adminId } = await knex('User').where('name', adminName).first('id')
  const results = await knex('Result').where('partnerId', partnerId)
  const inserts = []
  for (let i = 0; i < results.length; i += 2) {
    const result = results[i]
    const insert = knex('MissingInventoryLots').insert({
      resultId: result.id,
      expirationDate: result.consumableExpirationDate,
      lotNumber: Math.floor(Math.random() * 500),
      siteId: result.siteId,
      createdOn: result.createdOn,
      createdBy: adminId,
    })
    inserts.push(insert)
  }
  await Promise.all(inserts)
}
