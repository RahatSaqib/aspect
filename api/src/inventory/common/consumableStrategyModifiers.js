const _ = require('lodash')

function matchByLotModifier(knexQuery, { lotNumber }, inventoryItemAlias = 'ii') {
  if (!_.isEmpty(lotNumber)) {
    knexQuery.where('ii.lotNumber', lotNumber)
  } else {
    knexQuery.where(builder =>
      builder.whereNull(`${inventoryItemAlias}.lotNumber`).orWhere(`${inventoryItemAlias}.lotNumber`, '')
    )
  }
}

function matchByExpirationDateModifier(knexQuery, { expiresOn = null }, inventoryItemAlias = 'ii') {
  if (!_.isNil(expiresOn)) {
    knexQuery.whereRaw(`Date(${inventoryItemAlias}.expiresOn) = date(?)`, [expiresOn])
  } else {
    knexQuery.whereNull(`${inventoryItemAlias}.expiresOn`)
  }
}

function matchByLotAndExpirationDateModifier(knexQuery, { lotNumber, expiresOn }, inventoryItemAlias = 'ii') {
  matchByLotModifier(knexQuery, { lotNumber }, inventoryItemAlias)
  matchByExpirationDateModifier(knexQuery, { expiresOn }, inventoryItemAlias)
}

module.exports = {
  matchByLotModifier,
  matchByExpirationDateModifier,
  matchByLotAndExpirationDateModifier,
}
