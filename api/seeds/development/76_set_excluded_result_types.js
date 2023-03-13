module.exports = require('../utils').seed(async knex => {
  await knex('ResultType').update({ excluded: true }).whereNot({ externalId: 'Patient' })
}, __filename)
