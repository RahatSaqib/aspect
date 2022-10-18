module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('Person').update({
    culture: 'pt-PT',
  })
}
