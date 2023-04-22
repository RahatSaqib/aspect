const _ = require('lodash')

/**
 * Returns the latest update date across multiple sources of data.
 * @param {object} data - The data object.
 * @param {array} followUps - The array of followUps.
 * @param {array} comments - The array of comments.
 * @returns The maximum value of all extracted and concatenated dates.
 */

function filterTrueUpdatedOnDate(data, followUps, comments) {
  const otherDates = _.pick(data, ['updatedOn', 'sampleCollectedOn', 'resultWorkflowStatusChangedOn'])
  const resultDates = _.map(otherDates, value => value)
  const followUpUpdatedOn = _.map(followUps, 'updatedOn')
  const commentUpdatedOn = _.map(comments, 'updatedOn')
  const allUpdatedOn = _.concat(followUpUpdatedOn, commentUpdatedOn, resultDates)
  return _.max(allUpdatedOn)
}

module.exports = { filterTrueUpdatedOnDate }
