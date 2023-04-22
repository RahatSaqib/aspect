const _ = require('lodash')

function filterTrueUpdatedOnDate(data, followUps, comments) {
  const otherDates = _.pick(data, ['updatedOn', 'sampleCollectedOn', 'resultWorkflowStatusChangedOn'])
  const resultDates = _.map(otherDates, value => value)
  const followUpUpdatedOn = _.map(followUps, 'updatedOn')
  const commentUpdatedOn = _.map(comments, 'updatedOn')
  const allUpdatedOn = _.concat(followUpUpdatedOn, commentUpdatedOn, resultDates)
  return _.max(allUpdatedOn)
}

module.exports = { filterTrueUpdatedOnDate }
