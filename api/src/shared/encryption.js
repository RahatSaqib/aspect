const crypto = require('crypto')
const _ = require('lodash')

function oneDirectionalMd5Hash(inputString) {
  if (inputString == null || _.isUndefined(inputString)) {
    return inputString
  }
  return crypto
    .createHash('md5')
    .update(inputString)
    .digest('hex')
}

module.exports = {
  oneDirectionalMd5Hash,
}
