const _ = require('lodash')

/**
 * Returns the latest update date across multiple sources of data.
 * @param {object} data - The data object.
 * @param {array} followUps - The array of followUps.
 * @param {array} comments - The array of comments.
 * @returns The maximum value of all extracted and concatenated dates.
 */

function getResultUpdatedOnDate(data, followUps) {
  const otherDates = _.pick(data, ['updatedOn', 'sampleCollectedOn', 'resultWorkflowStatusChangedOn'])
  const resultDates = _.map(otherDates, value => value)
  const followUpUpdatedOn = _.map(followUps, 'updatedOn')
  const allUpdatedOn = _.concat(followUpUpdatedOn, resultDates)
  return _.max(allUpdatedOn)
}

function getSampleUpdatedOnDate(data) {
  const otherDates = _.pick(data, ['sampleUpdatedOn', 'collectedOn'])
  const resultDates = _.map(otherDates, value => value)

  return _.max(resultDates)
}

module.exports = { getResultUpdatedOnDate, getSampleUpdatedOnDate }
