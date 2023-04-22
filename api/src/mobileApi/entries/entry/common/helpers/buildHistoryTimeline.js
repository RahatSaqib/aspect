const _ = require('lodash')
const { extractFromDataById } = require('./extractFromDataById')

function buildHistoryTimeline(data, followUps) {
  const output = []
  const resultFollowUps = extractFromDataById(followUps, 'resultId', data.id)
  output.push({
    id: data.sampleId,
    event: 'sampleCollected',
    name: data.sampleExternalId,
    siteName: data.sampleOriginSiteName,
    updatedOn: data.sampleCollectedOn,
  })
  _.map(resultFollowUps, followUp =>
    output.push({
      id: followUp.id,
      event: 'followUpCreated',
      name: followUp.followUpName,
      siteName: null,
      updatedOn: followUp.updatedOn,
    })
  )

  return _.sortBy(output, ['updatedOn']).reverse()
}

module.exports = { buildHistoryTimeline }
