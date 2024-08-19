const { knex } = require('../../db')
const { filterParams } = require('../../db')
const { addConstraints } = require('../../auth/constraints')
const { getResultWithUsedModules } = require('../common/db')

async function getUnusedModulesReportData(dataConstraints, query) {
  return getResultWithUsedModules(knex, query.minDate, query.maxDate)
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .whereNot('dt.externalId', 'GxAlert')
    .select([
      'd.name as deploymentName',
      'd.moduleBayCapacity as modulesAvailable',
      'd.lastInstrumentSerial as instrumentSerial',
      'st.name as State',
      'lg.name as Lga',
    ])
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
  getUnusedModulesReportData,
}
