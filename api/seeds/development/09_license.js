module.exports = require('../utils').seed(seed, __filename)
const config = require('../../src/config')
const { addLicenses, addLicensePersons } = require('../utils')

async function seed(knex) {
  // Skip this seed file if we already have licenses inserted
  const existingLicense = await knex('License').first('id')
  if (existingLicense || !config.isDevelopment) {
    return
  }
  await addLicenses(knex)
  await addLicensePersons(knex, 'Admin')
}
