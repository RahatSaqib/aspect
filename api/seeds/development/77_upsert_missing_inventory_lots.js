module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where('name', 'Partner One').first()
  await knex('Result')
    .where('partnerId', partnerId)
    .andWhere(knex.raw('MOD(id, 2) = 0'))
    .update('reconciliationDate', knex.ref('startedOn'))
}
