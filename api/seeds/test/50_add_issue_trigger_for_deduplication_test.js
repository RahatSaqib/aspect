const { partnerName } = require('./fixtures/partnerData')

// seeding a trigger for an event that we're no longer triggering in our common seeds, but need to test the correct deduplication of GeneXpert log entries
module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await knex('Partner')
    .where('name', partnerName)
    .first('id')

  const { id: issueTypeId } = await knex('IssueType')
    .where('externalId', 'HardwareModuleWasReset')
    .first('id')

  const { id: issueEventStatusId } = await knex('IssueEventStatus')
    .where('externalId', 'Triggered')
    .first('id')

  const triggerConditions = JSON.stringify({
    action: 'HARDWARE_MODULE_WAS_RESET',
    conditions: {
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'analyzeDeviceHardwareError',
      evaluationFilterParameters: {
        errorCodes: [2126],
        daysPeriod: 30,
        minErrors: 3,
      },
    },
  })

  await knex('IssueEventTrigger').insert({
    issueTypeId,
    partnerId,
    issueEventStatusId,
    triggerConditions,
    createdOn: new Date(),
    updatedOn: new Date(),
  })
}, __filename)
