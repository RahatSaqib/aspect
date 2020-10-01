module.exports = require('../utils').seed(seed, __filename)

const { generateResults } = require('../commonGenerateResults')
const patients = require('./fixtures/patients.json')

async function seed(knex) {
  const { partnerId, userId } = await knex('Person as p')
    .innerJoin('User as u')
    .where('u.name', 'admin')
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

  await generateResults(knex, userId, partnerId, patients, [5007])
}
