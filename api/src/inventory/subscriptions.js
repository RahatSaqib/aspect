const { missingInventoryLotsResolver } = require('./missingInventoryLotsResolver')

const subscriptions = [
  {
    actions: {
      INVENTORY_MISSING_LOTS_RESOLVER: missingInventoryLotsResolver,
    },
  },
]

module.exports = { subscriptions }
