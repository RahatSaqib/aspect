module.exports = require('../utils').seed(seed, 'test_11_license')

const { addLicenses, addLicensePersons } = require('../utils')

async function seed(knex) {
  await addLicenses(knex)
  await addLicensePersons(knex)
}
