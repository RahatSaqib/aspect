const Boom = require('@hapi/boom')
const { knex, filterParams, sortPageParams, filterDateRangeParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

module.exports = async function ({ params, auth }) {
  const { deviceId } = params

  // Get user constraints
  const dataConstraints = await getConstraints(auth.credentials)

  // Get instruments data with constraints applied
  const instrumentRows = await getDeviceComposition(deviceId, dataConstraints)

  if (!instrumentRows.length) {
    return Boom.notFound('Device not found')
  }

  // Check if device exists but has no instruments
  const hasDevice = instrumentRows.some(row => row.deviceId)
  if (!hasDevice) {
    return Boom.notFound('Device not found')
  }

  // Group modules by instrument
  const instrumentsMap = {}
  // const latestLetterByInstrument = {}

  instrumentRows.forEach(row => {
    // Skip rows with no instrument (device exists but no instruments)
    if (!row.instrumentSerial) {
      return
    }
    if (!instrumentsMap[row.instrumentSerial]) {
      instrumentsMap[row.instrumentSerial] = {
        instrumentSerial: row.instrumentSerial,
        modules: row.modules || [],
      }
    }
  })

  return {
    ok: true,
    data: {
      deviceId: parseInt(deviceId, 10),
      instruments: Object.values(instrumentsMap),
    },
  }
}

async function getDeviceComposition(deviceId, dataConstraints) {
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
          knex.raw(`json_object('moduleName', moduleName, 'lastDate', date(max(endedOn))) as modules`)
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
  console.log('\x1b[1;36m', '🚀 ➜ query:', query.toString())
  return query
}
