const crypto = require('crypto')
const base32 = require('base32')
const _ = require('lodash')

// alias table duplicated from base32 and regular expression and replace function
const base32Alias = { o: 0, i: 1, l: 1, s: 5 }
const base32AliasRegExp = new RegExp(
  `[${Object.keys(base32Alias).join('')}]`,
  'g'
)
const base32AliasReplacer = c => base32Alias[c]

function randomToken() {
  // creates a random 20 character base32 encoded token
  return base32.encode(crypto.randomBytes(12))
}

function groupToken(token) {
  // Groups 20 character token into 5 groups of 4 for easier readability
  // API Key validation will remove spaces and dashes, so they can be included
  return _.chunk(token, 4).map(a => a.join('')).join('-')
}

function normalizeToken(token) {
  return (
    token
      // case insensitive
      .toLowerCase()
      // Ignore dashes or spaces
      .replace(/[ -]/g, '')
      // Normalize base32 alias for similar characters
      .replace(base32AliasRegExp, base32AliasReplacer)
  )
}

module.exports = {
  randomToken,
  groupToken,
  normalizeToken,
}
