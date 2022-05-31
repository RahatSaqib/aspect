const _ = require('lodash')

module.exports = {
  withLotStrategy,
  withExpirationDateStrategy,
  withLotAndExpirationDateStrategy,
}

function withLotStrategy(knexQuery, { lotNumber }, inventoryItemAlias = 'ii') {
  if (!_.isEmpty(lotNumber)) {
    knexQuery.where('ii.lotNumber', lotNumber)
  } else {
    knexQuery.where(builder =>
      builder
        .whereNull(`${inventoryItemAlias}.lotNumber`)
        .orWhere(`${inventoryItemAlias}.lotNumber`, '')
    )
  }
}

function withExpirationDateStrategy(
  knexQuery,
  { expiresOn = null },
  inventoryItemAlias = 'ii'
) {
  if (!_.isNil(expiresOn)) {
    knexQuery.where(`${inventoryItemAlias}.expiresOn`, expiresOn)
  } else {
    knexQuery.whereNull(`${inventoryItemAlias}.expiresOn`)
  }
}

function withLotAndExpirationDateStrategy(
  knexQuery,
  { lotNumber, expiresOn },
  inventoryItemAlias = 'ii'
) {
  withLotStrategy(knexQuery, { lotNumber }, inventoryItemAlias)
  withExpirationDateStrategy(knexQuery, { expiresOn }, inventoryItemAlias)
}
