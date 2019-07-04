module.exports = require('../utils').seed(seed, __filename)

const { addLicenses, addLicensePersons } = require('../utils')

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingLicense = await knex('License').first('id')
  if (existingLicense) {
    return
  }
  await addLicenses(knex)
  await addLicensePersons(knex)
}
