const _ = require('lodash')

function* postProcessAddDeviceOperation(context) {
  const { knex, payload } = context
  const inventoryChanges = _.get(payload, 'data.inventoryChanges')
  if (!_.isEmpty(inventoryChanges)) {
    _.each(inventoryChanges, inventoryChange => {
      // console.log(inventoryChange)
    })
  }
  return {}
}

module.exports = postProcessAddDeviceOperation
