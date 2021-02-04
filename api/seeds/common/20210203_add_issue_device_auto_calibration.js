const addIssue = require('./add_issue')

module.exports = async (knex, jobFunctionsToNotify, partnerName, adminName) => {
  await addIssue(
    knex,
    'DeviceAutoCalibrated',
    jobFunctionsToNotify,
    partnerName,
    adminName
  )
}
