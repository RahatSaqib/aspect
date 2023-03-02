const { issueStatusToId } = require('../../shared/dictionary')

async function getActiveCalibrationIssue(knex, deviceId) {
  const issueStatusResolvedId = await issueStatusToId('Resolved')

  return knex('Issue as i')
    .where('i.deviceId', deviceId)
    .whereNot('i.issueStatusId', issueStatusResolvedId)
    .first('id as issueId')
}

module.exports = { getActiveCalibrationIssue }
