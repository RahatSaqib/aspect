module.exports = require('../utils').seed(
  async knex => knex('Person').whereNotNull('userId').update({ canLogIn: true }),
  __filename
)
