const _ = require('lodash')
const { parseISO, isValid } = require('date-fns')

const name = 'withExpirationDateStrategy'

function modifyConsumableMatching(knexQuery, { expiresOn = null }, inventoryItemAlias = 'ii') {
  if (!_.isNil(expiresOn)) {
    knexQuery.whereRaw(`Date(${inventoryItemAlias}.expiresOn) = date(?)`, [expiresOn])
  } else {
    knexQuery.whereNull(`${inventoryItemAlias}.expiresOn`)
  }
}

const isValidLotIdentifier = ({ expiresOn }) =>
  expiresOn instanceof Date || (typeof expiresOn === 'string' && isValid(parseISO(expiresOn)))

const filterFields = fields => {
  const { expiresOnField } = fields
  return [expiresOnField]
}

module.exports = {
  name,
  modifyConsumableMatching,
  isValidLotIdentifier,
  filterFields,
}
