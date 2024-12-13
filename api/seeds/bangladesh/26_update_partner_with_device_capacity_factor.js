module.exports = require('../utils').seed(async knex => {
  await knex('Partner').update({
    deviceCapacityFactor: 2,
  })
}, __filename)
