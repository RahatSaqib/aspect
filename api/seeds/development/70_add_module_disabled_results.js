module.exports = require('../utils').seed(seed, __filename)

const { issueTypeToId, issueStatusToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const now = new Date()

  const baseResult = await knex('Result as r')
    .innerJoin('Geography as g', 'g.id', 'r.geographyId')
    .innerJoin('Country as c', 'c.id', 'g.countryId')
    .where('c.name', 'United States')
    .first('r.*')

  const issue = {
    issueTypeId: await issueTypeToId('ModuleDisabled'),
    issueStatusId: await issueStatusToId('Active'),
    partnerId: baseResult.partnerId,
    geographyId: baseResult.geographyId,
    siteId: baseResult.siteId,
    deviceId: baseResult.deviceId,
    data: {
      moduleName: 'Module A',
      oldResultId: 98843,
      newModuleSerial: '666498',
      instrumentSerial: '805058',
      replacedModuleSerial: '645076',
    },
    createdOn: now,
    updatedOn: now,
  }

  await knex('Issue').insert(issue)

  const result = {
    ...baseResult,
    id: null,
    externalId: `${baseResult.externalId}_1`,
    moduleName: 'Module A',
    moduleSerial: 1000,
  }
  await knex('Result').insert(result)
}
