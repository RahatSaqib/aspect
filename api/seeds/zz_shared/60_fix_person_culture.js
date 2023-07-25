module.exports = require('../utils').seed(async knex => {
  await knex('Person').update({ culture: 'en-US' }).whereIn('culture', ['en', 'en-GB'])
}, __filename)
