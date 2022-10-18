module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const { seedIssueType, seedIssueEventTriggersForPartner, upsertNotificationTypes } = require('../utils')

async function seed(knex) {
  const { partnerId, userId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': 'admin' })
    .first('p.lastPartnerId as partnerId', 'p.userId')

  const issuesToInsert = [
    'CartridgeIntegrityTestFailureModule',
    'CartridgeIntegrityTestFailureLot',
    'SyringePressureTooHighModule',
    'SyringePressureTooHighLot',
    'SyringeStallErrorModule',
    'SyringeStallErrorLot',
    'UltrasonicHornFailureModule',
    'UltrasonicHornFailureLot',
    'UltrasonicHornTuningErrorModule',
    'UltrasonicHornTuningErrorLot',
    'UltrasonicHornCurrentOutOfRangeModule',
    'UltrasonicHornCurrentOutOfRangeLot',
    'AssaySpecificTerminationError1Module',
    'AssaySpecificTerminationError1Lot',
    'AssaySpecificTerminationError2Module',
    'AssaySpecificTerminationError2Lot',
  ]
  const notifications = []
  await Promise.each(issuesToInsert, async issue => {
    const issueTypeId = await seedIssueType(knex, issue, {
      userName: 'admin',
    })

    if (!issueTypeId) return

    const auditFields = {
      createdOn: new Date(),
      createdBy: userId,
      updatedOn: new Date(),
      updatedBy: userId,
    }

    const issueType = await knex('IssueType').where({ id: issueTypeId }).first()

    const { jobFunctionAdminId } =
      (await knex('JobFunction')
        .where({
          externalId: 'systemOne',
          partnerId,
        })
        .first('id as jobFunctionAdminId')) ||
      (await knex('JobFunction')
        .where({
          externalId: 'admin',
          partnerId,
        })
        .first('id as jobFunctionAdminId'))

    notifications.push({
      issueTypeId: issueType.id,
      messageTypeId: issueType.defaultMessageTypeId,
      partnerId,
      jobFunctionId: jobFunctionAdminId,
      level: 1,
      name: issueType.name,
      ...auditFields,
    })
  })
  await Promise.all([
    upsertNotificationTypes(knex, notifications),
    seedIssueEventTriggersForPartner(knex, partnerId, {
      issueTypeWhitelist: issuesToInsert,
    }),
  ])
}
module.exports = seed
