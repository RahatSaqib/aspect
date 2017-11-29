const _ = require('lodash')

function macAddressValid(macAddress) {
  return (
    _.isEmpty(macAddress) ||
    (macAddress.indexOf('MAC') === 0 &&
      macAddress.trim().length > 3 &&
      macAddress !== 'MAC005345000000')
  )
}

module.exports = {
  macAddressValid,
}
