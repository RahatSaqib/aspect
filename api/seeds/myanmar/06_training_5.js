module.exports = require('../../src/db').seed(seed)
const { rowsAsObject } = require('../utils')

const now = new Date()

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  // Issue Resolution Triggers
  await knex('IssueResolutionTrigger').insert([
    {
      issueTypeId: issueTypes.DeviceOffline.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './sqlScripts/Myanmar/issues/resolutions/deviceOfflineLUNetwork.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])
}
