const { parseISO, isValid } = require('date-fns')

const hasLot = ({ lotNumber }) => typeof lotNumber === 'number' || typeof lotNumber === 'string'

const hasExpirationDate = ({ expiresOn }) =>
  expiresOn instanceof Date || (typeof expiresOn === 'string' && isValid(parseISO(expiresOn)))

const hasLotAndExpirationDate = ({ lotNumber, expiresOn }) => hasLot({ lotNumber }) && hasExpirationDate({ expiresOn })

module.exports = {
  hasLot,
  hasExpirationDate,
  hasLotAndExpirationDate,
}
