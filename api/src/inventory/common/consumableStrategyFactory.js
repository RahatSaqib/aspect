const {
  matchByLotModifier,
  matchByExpirationDateModifier,
  matchByLotAndExpirationDateModifier,
} = require('./consumableStrategyModifiers')

const { hasLot, hasExpirationDate, hasLotAndExpirationDate } = require('./consumableStrategyValidators')

const withLotStrategy = { modifier: matchByLotModifier, validate: hasLot }

const withExpirationDateStrategy = { modifier: matchByExpirationDateModifier, validate: hasExpirationDate }

const withLotAndExpirationDateStrategy = {
  modifier: matchByLotAndExpirationDateModifier,
  validate: hasLotAndExpirationDate,
}

module.exports = {
  withLotStrategy,
  withExpirationDateStrategy,
  withLotAndExpirationDateStrategy,
}
