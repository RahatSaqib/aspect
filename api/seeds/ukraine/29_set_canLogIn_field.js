module.exports = require('../utils').seed(
  async knex =>
    knex('Person').whereRaw('userId IS NOT NULL').update({ canLogIn: true }),
  __filename
)
