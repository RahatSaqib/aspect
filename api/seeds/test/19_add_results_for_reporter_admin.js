module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const {
  normalizeTreatmentStatusDistribution,
  generateResults,
  getTreatmentDistributionByPartner,
} = require('../commonGenerateResults')
const patients = require('./fixtures/patients.json')
const { errorCodes } = require('./fixtures/errorCodes.js')

async function seed(knex) {
  const { partnerId, userId } = await knex('Person as p')
    .innerJoin('User as u')
    .where('u.name', 'reporter_admin')
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

  const resultsByPartnerByMonth = await getTreatmentDistributionByPartner(knex, partnerId)
  if (resultsByPartnerByMonth.length === 0) {
    await generateResults(knex, userId, partnerId, patients, errorCodes)
  }

  const partners = await knex('Partner as p').select('p.id as partnerId')

  await Promise.each(partners, async partner => {
    await normalizeTreatmentStatusDistribution(knex, partner.partnerId)
  })
}
