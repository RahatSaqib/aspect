const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

function getDeviceInstrumentsData(deviceId, dataConstraints) {
  return knex('Device as d')
    .where('d.id', deviceId)
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .join('Instrument as i', 'i.deviceId', 'd.id')
    .leftJoin('InstrumentModule as m', 'm.instrumentId', 'i.id')
    .groupBy('d.id', 'i.id', 'i.active', 'i.serial')
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
      knex.raw(
        `json_arrayagg(IF(m.moduleName IS NULL, NULL,
          json_object('moduleName', m.moduleName, 'lastResultDate', m.lastResultDate))) as modules`
      )
    )
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
