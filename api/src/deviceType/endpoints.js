const { asyncHandler } = require('../routes')
const { listDeviceTypesForSelectList } = require('./listDeviceTypesForSelectList')

const routes = [
  {
    method: 'GET',
    path: '/device-type/select-list',
    handler: asyncHandler(listDeviceTypesForSelectList),
    config: {
      description: 'Device Type List',
      notes: "List of device type ID's and names",
      auth: { scope: ['device:view', 'browse'] },
    },
  },
]

module.exports = { routes }
