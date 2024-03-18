async function seed(knex) {
  await knex('Site').update({
    timezoneid: knex('Geography AS g')
      .join('Country AS c', 'g.countryId', 'c.id')
      .select('c.timezone')
      .where('g.id', knex.ref('Site.geographyId')),
  })

  await knex('Device').update({
    timezone: knex('Site').select('timezoneid').where('id', knex.ref('Device.siteId')),
  })
}

module.exports = require('../utils').seed(seed, __filename)
