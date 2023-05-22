const _ = require('lodash')

/**
 * Returns a followUp object from the provided followUps array that has a followUpTypeExternalId matching the provided
 * type argument.
 * @param {Array} followUps - The array of followUps to search through.
 * @param {string} type - The type of followUp to search for.
 * @returns {object} A followUp object with a matching followUpTypeExternalId, or undefined if no such object is found
 * in desc order by updated date.
 */

function getFollowUpByType(followUps, type) {
  return _.orderBy(
    _.find(followUps, followUp => followUp.followUpTypeExternalId === type),
    ['updatedOn'],
    ['desc']
  )
}

module.exports = { getFollowUpByType }
