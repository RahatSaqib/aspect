module.exports = require('../utils').seed(async knex => {
  // This seeding file should run before 08_update_permissions_fixture
  await knex('JobFunction').where('externalId', 'admin').update({
    name: 'Super Admin',
    externalId: 'superAdmin',
  })
  await knex('JobFunction').where('externalId', 'manager').update({
    name: 'Regional Admin',
    externalId: 'regionalAdmin',
  })
}, __filename)
