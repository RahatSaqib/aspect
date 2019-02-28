module.exports = require('../utils').seed(seed)

const { addLicenses, addLicensePersons } = require('../utils')

async function seed(knex) {
  await addLicenses(knex)
  await addLicensePersons(knex)
}
