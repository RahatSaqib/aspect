module.exports = require('../utils').seed(seed, __filename)

const { seedAbbottM2000AndAssays } = require('../utils_abbott_m2000')

async function seed(knex) {
  await seedAbbottM2000AndAssays(knex)
}
