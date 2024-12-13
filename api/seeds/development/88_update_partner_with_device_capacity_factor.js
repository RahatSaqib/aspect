module.exports = require('../utils').seed(async knex => {
  await knex('Partner').update({
    deviceCapacityFactor: 3,
  })
}, __filename)
