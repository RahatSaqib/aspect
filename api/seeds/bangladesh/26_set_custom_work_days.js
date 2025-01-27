module.exports = require('../utils').seed(seed, __filename)

const {
  partner: { externalId },
} = require('./fixtures/partnerData')

async function seed(knex) {
  await knex('Partner')
    .where({ externalId })
    .update({
      customWorkingDays: JSON.stringify({
        excludedDays: '6', // Exclude Fridays. the function DAYOFWEEK starts from Sunday 1-7, where 1 is Sunday and 7 is Saturday
        daysPerMonth: 24,
        daysPerQuarter: 72,
        daysPerYear: 288,
      }),
    })
}
