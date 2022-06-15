const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const {
  getBaseQuery: getResultBaseQuery,
  modifiers,
} = require('../../result/query')

async function getModuleStatusReportData(
  minDate,
  maxDate,
  dataConstraints,
  query
) {
  const [issueTypeModuleDisabledId] = await knex('IssueType')
    .where({ name: 'Module Disabled' })
    .pluck('id')

  const [issueStatusActiveId] = await knex('IssueStatus')
    .where({ name: 'Active' })
    .pluck('id')

  const lastResults = getResultBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.lastResultPerModule, knex)
    .select([
      'r.deviceId',
      knex.raw('r.resultData ->> "$.moduleName" as moduleName'),
      'r.createdOn as resultDate',
      'r.moduleSerial as moduleSerial',
    ])
    .whereRaw('r.resultData ->> "$.moduleName" is not null')

  const moduleAvailability = knex
    .from(lastResults.as('lastResult'))
    .leftJoin('Issue as issueModuleDisabled', function () {
      this.on('issueModuleDisabled.deviceId', 'lastResult.deviceId')
        .andOn(
          'lastResult.moduleSerial',
          knex.raw('issueModuleDisabled.data ->> "$.moduleSerial"')
        )
        .andOn('issueModuleDisabled.issueTypeId', issueTypeModuleDisabledId)
        .andOn('issueModuleDisabled.issueStatusId', issueStatusActiveId)
    })
    .select([
      'lastResult.deviceId',
      knex.raw(
        'sum(case when issueModuleDisabled.id is null then 1 else 0 end) as enabled'
      ),
      knex.raw(
        'sum(case when issueModuleDisabled.id is null then 0 else 1 end) as disabled'
      ),
    ])
    .groupBy('lastResult.deviceId')

  const moduleReplacedIssuesForPeriod = knex('Issue as issueModuleReplaced')
    .join('IssueType as it', 'issueModuleReplaced.issueTypeId', 'it.id')
    .where('it.name', 'Module Replaced')
    .where('issueModuleReplaced.createdOn', '>=', minDate)
    .where('issueModuleReplaced.createdOn', '<', maxDate)
    .select('issueModuleReplaced.deviceId')
    .count('issueModuleReplaced.id as qty')
    .groupBy('issueModuleReplaced.deviceId')

  return knex('Device as d')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('State as state', 'state.id', 'g.stateId')
    .innerJoin('Lga as lga', 'lga.id', 'g.lgaId')
    .leftJoin(moduleAvailability.as('moduleAvailability'), function () {
      this.on('moduleAvailability.deviceId', 'd.id')
    })
    .leftJoin(moduleReplacedIssuesForPeriod.as('mr'), function () {
      this.on('mr.deviceId', 'd.id')
    })
    .where('dt.externalId', 'CepheidGeneXpert')
    .select([
      'd.name as deviceName',
      'd.serial as deviceSerial',
      'state.name as State',
      'lga.name as Lga',
      knex.raw('ifnull(moduleAvailability.enabled, 0) as functionalModules'),
      knex.raw('ifnull(moduleAvailability.disabled, 0) as disabledModules'),
      knex.raw('ifnull(mr.qty, 0) as replacedModules'),
    ])
    .groupBy('d.id')
    .orderBy(['d.name'])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      partner: 'p',
    })
    .modify(filterParams, query, {
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
}

module.exports = {
  getModuleStatusReportData,
}
