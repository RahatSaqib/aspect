const { upsertTruenatDeviceTypeAndAssays } = require('../commonTruenat')
const { generateResults } = require('../commonGenerateResults')
const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')

module.exports = require('../utils').seed(async knex => {
  await upsertTruenatDeviceTypeAndAssays(knex)
  const { partnerId, userId } = await knex('Person as p')
    .innerJoin('User as u')
    .where('u.name', 'admin')
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')
  await generateResults(knex, userId, partnerId, patients, errorCodes, 'US', true, 20)
}, __filename)
