const crypto = require('crypto')
const base32 = require('base32')
const _ = require('lodash')

function randomToken() {
  // creates a random 20 character base32 encoded token
  return base32.encode(crypto.randomBytes(12))
}

function groupToken(token) {
  // Groups 20 character token into 5 groups of 4 for easier readability
  // API Key validation will remove spaces and dashes, so they can be included
  return _.chunk(token, 4)
    .map(a => a.join(''))
    .join('-')
}

function normalizeToken(token) {
  return (
    token
      // case insensitive
      .toLowerCase()
      // Ignore dashes or spaces
      .replace(/[ -]/g, '')
  )
}

module.exports = {
  randomToken,
  groupToken,
  normalizeToken,
}
