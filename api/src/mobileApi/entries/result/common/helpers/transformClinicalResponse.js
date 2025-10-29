const _ = require('lodash')
const { getFollowUpByType } = require('./getFollowUpByType')
const { FOLLOW_UP_TYPES } = require('../../../common/consts')

function transformClinicalResponse(data, followUps) {
  const treatment = getFollowUpByType(followUps, FOLLOW_UP_TYPES.TREATMENT)
  const outcome = getFollowUpByType(followUps, FOLLOW_UP_TYPES.OUTCOME)
  const output = _.pickBy(
    {
      resultId: data.id,
      outcome: outcome?.followUpExternalId ?? null,
      outcomeOccurred: outcome?.updatedOn ?? null,
      treatment: treatment?.followUpExternalId ?? null,
      treatmentStarted: treatment?.updatedOn ?? null,
    },
    _.identity
  )
  return output
}

module.exports = { transformClinicalResponse }
