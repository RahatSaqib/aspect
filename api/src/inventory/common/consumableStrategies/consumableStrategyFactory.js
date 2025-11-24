const withLotStrategy = require('./withLotNumberStrategy')
const withExpirationDateStrategy = require('./withExpirationDateStrategy')
const withLotAndExpirationDateStrategy = require('./withLotAndExpirationDateStrategy')

function getConsumableStrategy(inventoryStrategy) {
  inventoryStrategy = inventoryStrategy.trim()

  const strategies = {
    withLotStrategy,
    withExpirationDateStrategy,
    withLotAndExpirationDateStrategy,
  }

  if (!strategies[inventoryStrategy]) {
    throw new Error(`'${inventoryStrategy}' is not a valid inventory strategy.`)
  }

  return strategies[inventoryStrategy]
}

module.exports = {
  getConsumableStrategy,
}
