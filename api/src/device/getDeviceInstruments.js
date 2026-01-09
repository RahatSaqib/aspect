const Boom = require('@hapi/boom')
const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

function getDeviceInstrumentsData(deviceId, dataConstraints) {
  const query = knex('Device as d')
    .where('d.id', deviceId)
    .join('Site as s', 'd.siteId', 's.id')
    .leftJoin('Instrument as i', function () {
      this.on('i.deviceId', 'd.id')
    })
    .leftJoin(
      knex('Result as r')
        .groupBy('deviceId', 'instrumentSerial', 'moduleName')
        .select(
          'deviceId',
          'instrumentSerial',
          'moduleName',
          knex.raw(`json_object('moduleName', moduleName, 'lastResultDate', date(max(endedOn))) as modules`)
        )
        .as('m'),
      function () {
        this.on('m.deviceId', 'd.id')
      }
    )
    .groupBy('d.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
    })
    .select('d.id as deviceId', 'i.serial as instrumentSerial', knex.raw('json_arrayagg(modules) as modules'))

  return query
}

async function getDeviceInstruments({ params, auth }) {
  const { deviceId } = params

  // Get user constraints
  const dataConstraints = await getConstraints(auth.credentials)

  // Get instruments data with constraints applied
  const instrumentRows = await getDeviceInstrumentsData(deviceId, dataConstraints)

  if (!instrumentRows.length) {
    return Boom.notFound('Device not found')
  }

  // For each instrument, use the prefix from the most recent module to build an array of 4 modules (e.g. B1-B4),
  // filling in any missing modules with null for lastResultDate.
  const instruments = instrumentRows.map(instrument => {
    const modulesData = JSON.parse(instrument.modules)
    const mostRecentModule = _.maxBy(modulesData, m => m.lastResultDate || '')
    const moduleNameLetter = mostRecentModule ? mostRecentModule.moduleName.charAt(0) : 'B'

    const modules = [1, 2, 3, 4].map(moduleNumber => {
      const moduleName = `${moduleNameLetter}${moduleNumber}`
      const moduleInfo = modulesData.find(m => m.moduleName === moduleName)
      return {
        moduleName,
        lastResultDate: moduleInfo ? moduleInfo.lastResultDate : null,
      }
    })

    return {
      instrumentSerial: instrument.instrumentSerial,
      modules,
    }
  })

  return {
    ok: true,
    data: {
      deviceId,
      instruments,
    },
  }
}

module.exports = {
  getDeviceInstruments,
}
