module.exports = require('../utils').seed(seed, __filename)
const {
  normalizeTreatmentStatusDistribution,
  getTreatmentDistributionByPartner,
} = require('../commonGenerateResults')
const Promise = require('bluebird')

async function seed(knex) {
  const { partnerId } = await knex('Person as p')
    .innerJoin('User as u')
    .where('u.name', 'admin')
    .first('p.lastPartnerId as partnerId', 'p.id as personId', 'p.userId')

  const resultsByPartnerByMonth = await getTreatmentDistributionByPartner(
    knex,
    partnerId
  )

  await Promise.each(resultsByPartnerByMonth, async results => {
    if (
      Math.round(
        (results.inTreatment /
          parseFloat(Math.max(results.totalQuantity, 1.0))) *
          100
      ) > 70
    ) {
      await normalizeTreatmentStatusDistribution(knex, partnerId, results.month)
    }
  })
}
