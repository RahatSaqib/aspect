const {
  modifyConsumableMatching: lotNumberModifier,
  isValidLotIdentifier: lotNumberValidator,
} = require('./withLotNumberStrategy.js')
const {
  modifyConsumableMatching: expirationDateModifier,
  isValidLotIdentifier: expirationDateValidator,
} = require('./withExpirationDateStrategy')

const name = 'withLotAndExpirationDateStrategy'

function modifyConsumableMatching(knexQuery, { lotNumber, expiresOn }, inventoryItemAlias = 'ii') {
  lotNumberModifier(knexQuery, { lotNumber }, inventoryItemAlias)
  expirationDateModifier(knexQuery, { expiresOn }, inventoryItemAlias)
}

const isValidLotIdentifier = ({ lotNumber, expiresOn }) =>
  lotNumberValidator({ lotNumber }) && expirationDateValidator({ expiresOn })

module.exports = {
  name,
  modifyConsumableMatching,
  isValidLotIdentifier,
}
