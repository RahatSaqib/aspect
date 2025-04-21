module.exports = require('../utils').seed(seed, __filename)

const { adminUserName } = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where('name', 'Partner One').first()
  const { id: adminId } = await knex('User').where('name', adminUserName).first('id')
  const results = await knex('Result').where('partnerId', partnerId)
  const inserts = []
  for (let i = 0; i < results.length; i += 2) {
    const result = results[i]
    inserts.push({
      resultId: result.id,
      expirationDate: result.consumableExpirationDate,
      lotNumber: result.consumableLot,
      siteId: result.siteId,
      createdOn: result.createdOn,
      createdBy: adminId,
    })
  }
  if (inserts.length) {
    await knex('MissingInventoryLots').insert(inserts)
  }
}
