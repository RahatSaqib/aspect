const _ = require('lodash')

const name = 'withLotNumberStrategy'

function modifyConsumableMatching(knexQuery, { lotNumber }, inventoryItemAlias = 'ii') {
  if (!_.isEmpty(lotNumber)) {
    knexQuery.where('ii.lotNumber', lotNumber)
  } else {
    knexQuery.where(builder =>
      builder.whereNull(`${inventoryItemAlias}.lotNumber`).orWhere(`${inventoryItemAlias}.lotNumber`, '')
    )
  }
}

const isValidLotIdentifier = ({ lotNumber }) => typeof lotNumber === 'number' || typeof lotNumber === 'string'

const filterFields = fields => {
  const { lotNumberField } = fields
  return [lotNumberField]
}

module.exports = {
  name,
  modifyConsumableMatching,
  isValidLotIdentifier,
  filterFields,
}
