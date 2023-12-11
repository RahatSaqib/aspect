module.exports = require('../utils').seed(async knex => {
  await knex('Person').update({
    timezone: knex('Geography as g')
      .select('c.timezone')
      .join('Country as c', 'g.countryId', 'c.id')
      .where('g.id', knex.ref('Person.geographyId')),
  })
}, __filename)
