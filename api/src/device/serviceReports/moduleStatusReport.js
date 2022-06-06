const { subDays, startOfToday } = require('date-fns')
const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

async function getModuleStatusReportData(
  minDate,
  maxDate,
  dataConstraints,
  query
) {
  const today = startOfToday()

  const modulesWithResultsLastMonth = knex('Result as r')
    .select('r.deviceId')
    .countDistinct('r.moduleName as qty')
    .where('r.endedOn', '>=', subDays(today, 30))
    .groupBy('r.deviceId')

  const modulesWihtoutResultsLastMonthButResultsTheMonthBefore = knex(
    'Result as r'
  )
    .select('r.deviceId')
    .countDistinct('r.moduleName as qty')
    .where('r.endedOn', '>=', subDays(today, 60))
    .where('r.endedOn', '<', subDays(today, 30))
    .whereNotExists(
      knex('Result as r2')
        .select('*')
        .where('r2.endedOn', '>=', subDays(today, 30))
        .where('r2.deviceId', 'r.deviceId')
        .where('r2.moduleName', 'r.moduleName')
    )
    .groupBy('r.deviceId')

  const moduleReplacedIssuesForPeriod = knex('Issue as i3')
    .join('IssueType as it', 'i3.issueTypeId', 'it.id')
    .where('it.name', 'Module Replaced')
    .where('i3.createdOn', '>=', minDate)
    .where('i3.createdOn', '<', maxDate)
    .select('i3.deviceId')
    .count('i3.id as qty')

  return knex('Device as d')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('State as state', 'state.id', 'g.stateId')
    .innerJoin('Lga as lga', 'lga.id', 'g.lgaId')
    .leftJoin(modulesWithResultsLastMonth.as('activeModules'), function () {
      this.on('d.id', 'activeModules.deviceId')
    })
    .leftJoin(
      modulesWihtoutResultsLastMonthButResultsTheMonthBefore.as(
        'inactiveModules'
      ),
      function () {
        this.on('d.id', 'inactiveModules.deviceId')
      }
    )
    .leftJoin(moduleReplacedIssuesForPeriod.as('mr'), function () {
      this.on('mr.deviceId', 'd.id')
    })
    .where('dt.externalId', 'CepheidGeneXpert')
    .select([
      'd.name as deviceName',
      'd.serial as deviceSerial',
      'state.name as State',
      'lga.name as Lga',
      knex.raw('ifnull(activeModules.qty, 0) as functionalModules'),
      knex.raw('ifnull(inactiveModules.qty, 0) as disabledModules'),
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
