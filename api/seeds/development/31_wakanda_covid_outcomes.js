module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const sampleSize = require('lodash/sampleSize')
const sample = require('lodash/sample')

const resultMultiplier = process.env['seeds.resultMultiplier'] || 100

async function seed(knex) {
  const results = await knex('ResultFollowUp').select('resultId', 'followUpId', 'externalId', 'updatedBy')
  const followUps = await knex('FollowUp').select('id', 'externalId')
  /** Grab random sample from current outcomes equaling % of mulitplier */
  const resultSampleSize = 40
  const resultsSample = sampleSize(results, (resultSampleSize / 100) * resultMultiplier)

  const randomOutcomeResult = ({ externalId }) => {
    let updated = {}

    switch (externalId) {
      case 'admissionToHospital':
        updated = followUps.filter(m => m.externalId === sample(['died', 'recovered', 'recovered']))
        break

      case 'admissionToHospitalIcu':
        updated = followUps.filter(m => m.externalId === sample(['died', 'died', 'died', 'recovered']))
        break

      case 'quarantine':
        updated = followUps.filter(m => m.externalId === sample(['died', 'recovered', 'unknown']))
        break

      case 'selfQuarantine':
        updated = followUps.filter(m => m.externalId === sample(['recovered', 'unknown']))
        break

      default:
        updated = followUps.filter(m => m.externalId === externalId)
        break
    }
    return updated
  }

  await Promise.each(resultsSample, async r => {
    const newOutcome = await randomOutcomeResult(r)
    const { id, externalId } = newOutcome[0] || false
    if ((id, externalId)) {
      const item = await knex('ResultFollowUp')
        .where({
          resultId: r.resultId,
          externalId,
        })
        .first()
      if (!item) {
        return knex('ResultFollowUp').where({ resultId: r.resultId }).update({
          externalId,
          followUpId: id,
          updatedOn: new Date(),
          updatedBy: r.updatedBy,
        })
      }
    }
  }).catch(rejection => {
    throw new Error(rejection)
  })
}
