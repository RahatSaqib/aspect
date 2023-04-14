function getFollowUpByType(followUps, type) {
  return followUps.find(followUp => followUp.followUpTypeExternalId === type)
}

module.exports = { getFollowUpByType }
