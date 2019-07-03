module.exports = require('../utils').seed(seed, __filename)

const { addLicenses, addLicensePersons } = require('../utils')

async function seed(knex) {
  await addLicenses(knex)
  await addLicensePersons(knex)
}
