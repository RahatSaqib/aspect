module.exports = require('../utils').seed(seed, __filename)

const {
  partner: { externalId },
} = require('./fixtures/partnerData')

async function seed(knex) {
  await knex('Partner')
    .where({ externalId })
    .update({
      customWorkingDays: JSON.stringify({
        excludedDays: '4', // Exclude Fridays. To include another day, add a comma and the day number, e.g. '5,6'. MySQL starts from 0=Monday, 1=Tuesday, ..., 6=Sunday
        daysPerMonth: 24,
        daysPerQuarter: 72,
        daysPerYear: 288,
      }),
    })
}
