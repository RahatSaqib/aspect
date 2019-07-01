module.exports = require('../utils').seed(seed, 'development_13_license.js')

const { addLicenses, addLicensePersons } = require('../utils')

async function seed(knex) {
  await addLicenses(knex)
  await addLicensePersons(knex, 'Admin')
}
