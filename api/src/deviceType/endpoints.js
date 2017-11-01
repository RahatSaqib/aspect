const { asyncHandler } = require('../routes')
const { listDeviceTypesForSelectList } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/device-type/select-list',
    handler: asyncHandler(listDeviceTypesForSelectList),
    config: {
      description: 'Device Type List',
      notes: "List of device type ID's and names",
      auth: { scope: ['device:view', 'device:edit'] },
    },
  },
]
