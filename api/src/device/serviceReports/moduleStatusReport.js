const { subDays, startOfToday } = require('date-fns')
const { groupBy } = require('lodash')
const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

async function getModuleStatusReportData(
  minDate,
  maxDate,
  dataConstraints,
  query
) {
  const [[issueTypeModuleDisabledId], [issueTypeModuleReplacedId]] =
    await Promise.all([
      await knex('IssueType').where({ name: 'Module Disabled' }).pluck('id'),
      await knex('IssueType').where({ name: 'Module Replaced' }).pluck('id'),
    ])

  const lastResults = knex('Result as r')
    .join(
      knex('Result as r2')
        .groupBy('r2.deviceId', knex.raw('r2.resultData ->> "$.moduleName"'))
        .select('r2.deviceId')
        .max('r2.id as id')
        .as('rmax'),
      function () {
        this.on('r.id', 'rmax.id')
      }
    )
    .select([
      'r.deviceId',
      knex.raw('r.resultData ->> "$.moduleName" as moduleName'),
      'r.createdOn as lastResultDate',
      'r.moduleSerial as lastSerial',
    ])
    .whereRaw('r.resultData ->> "$.moduleName" is not null')

  const moduleAvailability = knex
    .from(lastResults.as('m'))
    .leftJoin('Issue as i', function () {
      this.on('i.deviceId', 'm.deviceId')
        .andOn('m.lastSerial', knex.raw('i.data ->> "$.moduleSerial"'))
        .andOn('i.issueTypeId', issueTypeModuleDisabledId)
        .andOn(knex.raw('i.data ->> "$.disabledOn"'), '>', 'm.lastResultDate')
    })
    .leftJoin('Issue as ir', function () {
      this.on('ir.deviceId', 'm.deviceId')
        .andOn(knex.raw('ir.data ->> "$.replacedModuleSerial"'), 'm.lastSerial')
        .andOn('ir.issueTypeId', issueTypeModuleReplacedId)
        .andOn('ir.createdOn', '>', 'm.lastResultDate')
    })
    .select([
      'm.deviceId',
      knex.raw('sum(case when i.id is null then 1 else 0 end) as enabled'),
      knex.raw('sum(case when i.id is null then 0 else 1 end) as disabled'),
    ])
    .groupBy('m.deviceId')

  const moduleReplacedIssuesForPeriod = knex('Issue as i3')
    .join('IssueType as it', 'i3.issueTypeId', 'it.id')
    .where('it.name', 'Module Replaced')
    .where('i3.createdOn', '>=', minDate)
    .where('i3.createdOn', '<', maxDate)
    .select('i3.deviceId')
    .count('i3.id as qty')
    .groupBy('i3.deviceId')

  return knex('Device as d')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('State as state', 'state.id', 'g.stateId')
    .innerJoin('Lga as lga', 'lga.id', 'g.lgaId')
    .leftJoin(moduleAvailability.as('ma'), function () {
      this.on('ma.deviceId', 'd.id')
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
      knex.raw('ifnull(ma.enabled, 0) as functionalModules'),
      knex.raw('ifnull(ma.disabled, 0) as disabledModules'),
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
