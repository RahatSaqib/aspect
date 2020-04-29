module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')

const resultMultiplier = process.env['seeds.resultMultiplier'] || 100

async function seed(knex) {
  const now = new Date()
  const results = await knex('ResultFollowUp').select(
    'resultId',
    'followUpId',
    'updatedBy'
  )
  const followUps = await knex('FollowUp').select('id', 'externalId')
  // Grab random sample from current outcomes equaling 25% of mulitplier
  const resultsSample = _.sampleSize(results, (25 / 100) * resultMultiplier)

  const randomOutcomeResult = ({ followUpId }) => {
    /**
     * Add outcomes to specific types randomising between set outcomes.
     */
    let updated = {}
    switch (followUpId) {
      case 18:
        /**
         * admissionToHospital [18]: randomise between died and recovered with
         * weight on recovery [14]
         */
        updated = followUps.filter(m => m.id === _.sample([13, 14, 14]))
        break

      case 19:
        /**
         * admissionToHospitalIcu [19]: randomise between died and recovered with
         * weight on died [13]
         */
        updated = followUps.filter(m => m.id === _.sample([13, 13, 13, 14]))
        break

      case 20:
        /**
         * quarantine [20]: randomise between died, recovered and unknown
         */
        updated = followUps.filter(m => m.id === _.sample([13, 14, 16]))
        break

      case 21:
        /**
         * selfQuarantine [21]: randomise between recovered and unknown
         */
        updated = followUps.filter(m => m.id === _.sample([14, 16]))
        break

      default:
        updated = followUps.filter(m => m.id === followUpId)
        break
    }
    return updated
  }

  await Promise.all(
    _.map(resultsSample, async r => {
      const newOutcome = await randomOutcomeResult(r)
      const { id, externalId } = newOutcome[0] || false
      if ((id, externalId)) {
        await knex('ResultFollowUp')
          .where({ resultId: r.resultId })
          .update({
            externalId,
            followUpId: id,
            updatedOn: now,
            updatedBy: r.updatedBy,
          })
      }
    })
  )
}
