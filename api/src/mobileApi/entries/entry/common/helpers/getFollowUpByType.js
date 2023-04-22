/**
 * Returns a followUp object from the provided followUps array that has a followUpTypeExternalId matching the provided type argument.
 * @param {Array} followUps - The array of followUps to search through.
 * @param {string} type - The type of followUp to search for.
 * @returns {object} A followUp object with a matching followUpTypeExternalId, or undefined if no such object is found.
 */

function getFollowUpByType(followUps, type) {
  return followUps.find(followUp => followUp.followUpTypeExternalId === type)
}

module.exports = { getFollowUpByType }
