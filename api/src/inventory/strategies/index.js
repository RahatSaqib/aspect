const _ = require('lodash')

module.exports = {
  withLotStrategy,
  withExpiresDateStrategy,

  default: withLotAndExpirationDateStrategy,
}

async function withLotStrategy(
  knexQuery,
  { lotNumber },
  inventoryItemAlias = 'ii'
) {
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

async function withExpiresDateStrategy(
  knexQuery,
  { expiresOn },
  inventoryItemAlias = 'ii'
) {
  if (!_.isEmpty(expiresOn)) {
    knexQuery.where(`${inventoryItemAlias}.expiresOn`, expiresOn)
  } else {
    knexQuery.whereNull(`${inventoryItemAlias}.expiresOn`)
  }
}

async function withLotAndExpirationDateStrategy(
  knexQuery,
  { expiresOn, lotNumber },
  inventoryItemAlias = 'ii'
) {
  return withLotStrategy(
    withExpiresDateStrategy(knexQuery, { expiresOn }, inventoryItemAlias),
    { lotNumber },
    inventoryItemAlias
  )
}
