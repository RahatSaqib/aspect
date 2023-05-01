const { missingLotsResolver } = require('./missingLotsResolver')

const subscriptions = [
  {
    actions: {
      INVENTORY_MISSING_LOTS_RESOLVER: missingLotsResolver,
    },
  },
]

module.exports = { subscriptions }
