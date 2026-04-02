const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

function getDeviceInstrumentsData(deviceId, dataConstraints) {
  const query = knex('Device as d')
    .where('d.id', deviceId)
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .join('Instrument as i', function () {
      this.on('i.deviceId', 'd.id')
    })
    .leftJoin(
      knex('Result as r')
        .groupBy('deviceId', 'instrumentSerial', knex.raw('TRIM(moduleName)'))
        .select(
          'deviceId',
          'instrumentSerial',
          knex.raw('TRIM(moduleName) as moduleName'),
          knex.raw(`json_object('moduleName', TRIM(moduleName), 'lastResultDate', date(max(endedOn))) as modules`)
        )
        .as('m'),
      function () {
        this.on('m.deviceId', 'd.id').andOn('m.instrumentSerial', 'i.serial')
      }
    )
    .groupBy('d.id', 'i.serial')
    .modify(
      addConstraints,
      dataConstraints,
      {
        device: 'd',
        site: 's',
      },
      { showUnapprovedDevices: true, showDecommissionedDevices: true }
    )
    .select(
      'd.id as deviceId',
      'i.id as instrumentId',
      'i.active as active',
      'i.serial as instrumentSerial',
      knex.raw('json_arrayagg(modules) as modules')
    )

  console.log('\x1b[1;36m', '🚀 ~ getDeviceInstrumentsData ~ query:', query.toString())
  return query
}

async function getDeviceInstruments({ params, auth }) {
  const { deviceId } = params

  // Get user constraints
  const dataConstraints = await getConstraints(auth.credentials)

  // Get instruments data with constraints applied
  const instrumentRows = await getDeviceInstrumentsData(deviceId, dataConstraints)

  // For each instrument, use the prefix from the most recent module to build an array of 4 modules (e.g. B1-B4),
  // filling in any missing modules with null for lastResultDate.
  const instruments = instrumentRows.map(instrument => {
    const modulesData = instrument.modules ? JSON.parse(instrument.modules) : []
    const mostRecentModule = _.maxBy(modulesData, m => m?.lastResultDate || '')
    const moduleNameLetter = mostRecentModule ? mostRecentModule.moduleName.charAt(0) : ''

    const modules = [1, 2, 3, 4].map(moduleNumber => {
      const moduleName = `${moduleNameLetter}${moduleNumber}`
      const moduleInfo = modulesData.find(m => m?.moduleName === moduleName)
      return {
        moduleName,
        lastResultDate: moduleInfo ? moduleInfo.lastResultDate : null,
      }
    })

    return {
      instrumentId: instrument.instrumentId,
      active: Boolean(instrument.active),
      instrumentSerial: instrument.instrumentSerial,
      modules,
    }
  })

  return {
    ok: true,
    data: {
      deviceId: parseInt(deviceId, 10),
      instruments,
    },
  }
}

module.exports = {
  getDeviceInstruments,
}
