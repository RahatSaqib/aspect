/* eslint-disable */
const { knex } = require('../../src/db')
const logger = require('../../src/shared/logger')

async function calculate(dateFrom, dateTo) {
  dateFrom = new Date(dateFrom.toDateString())
  dateTo = new Date(dateTo.toDateString())

  console.log(`Calculating FactDeviceModulesCount from ${dateFrom.toDateString()} to ${dateTo.toDateString()}`)

  const geneXpertDeviceIdsResult = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .where('dt.externalId', 'CepheidGeneXpert')
    .select(['d.id'])
  const geneXpertDeviceIds = geneXpertDeviceIdsResult.map(d => d.id)

  let devices = {}
  while (dateFrom < dateTo) {
    const nextDay = new Date(dateFrom)
    nextDay.setDate(nextDay.getDate() + 1)

    const rows = await knex('Result as r')
      .where('r.endedOn', '>=', dateFrom)
      .where('r.endedOn', '<', nextDay)
      .distinct()
      .select('r.deviceId', 'r.instrumentSerial', 'r.moduleName', 'r.moduleSerial')

    console.log(`Processing ${dateFrom.toDateString()}. Results: ${rows.length}`)

    rows.forEach(row => {
      const deviceId = row.deviceId

      if (!geneXpertDeviceIds.includes(deviceId))
        return

      const moduleBay = `${row.instrumentSerial}${row.moduleName}`
      const module = `${row.instrumentSerial}${row.moduleSerial}`
      let device
      if (devices.hasOwnProperty(deviceId))
        device = devices[deviceId]
      else {
        device = {
          moduleBays: {},
          modules: {},
        }
        devices[deviceId] = device
      }
      if (moduleBay)
        device.moduleBays[moduleBay] = 1
      if (module)
        device.modules[module] = 1
    })

    for (let key in devices) {
      const deviceObj = devices[key]
      await knex.raw('INSERT INTO FactDeviceModulesCount SET ? ON DUPLICATE KEY UPDATE ?', [
        {
          deviceId: key,
          date: dateFrom,
          moduleBaysUsed: Object.keys(deviceObj.moduleBays).length,
          modulesUsed: Object.keys(deviceObj.modules).length,

        },
        {
          moduleBaysUsed: Object.keys(deviceObj.moduleBays).length,
          modulesUsed: Object.keys(deviceObj.modules).length,
        }
      ])
    }
    devices = {}
    dateFrom.setDate(dateFrom.getDate() + 1)
  }

  console.log('Done')
}

const dateFrom = new Date(process.argv[2])
const dateTo = new Date(process.argv[3])
calculate(dateFrom, dateTo).then(
  () => process.exit(0),
  err => {
    logger.error(err)
    process.exit(1)
  }
)
