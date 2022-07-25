module.exports = require('../utils').seed(seed, __filename)

const { seedJobFunctionsAndUsersForOperationalData } = require('../utils')

async function seed(knex) {
  const now = new Date()
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const { id: countryId, culture, timezone } = await knex('Country').where('abbreviation', 'US').first()
  const { id: partnerId } = await knex('Partner').where('name', 'Partner One').first('id')

  await seedJobFunctionsAndUsersForOperationalData(knex, {
    auditFields,
    countryId,
    culture,
    partnerId,
    timezone,
    passwords: {
      cepheid: 'test07', // for jobFunction 'Device Maker'
      ntp: 'test07', // for jobFunction 'NTP'
      technician: 'test07', // for jobFunction 'Technician'
      usaid: 'test07', // for jobFunction 'Donor'
    },
  })
}
