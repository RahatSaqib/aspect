const isArray = require('lodash/isArray')

/**
 * Maps external ids to ids
 * @param {Object} keysDictionary A dictionary of ids by external id (Ex.: { 'theFirstRecord': 1 })
 * @param {any} externalId The external id or array of exteral ids
 * @returns If the provided external id is unique, then it will return the corresponding single id. If the provided external id is an array, then it will return an array of ids.
 */
const mapToId = (keysDictionary, externalId) => {
  let key
  if (externalId) {
    // Support filtering by multiple assay ids
    if (isArray(externalId)) {
      key = []
      externalId.forEach(x => {
        key.push(keysDictionary[x])
      })
    } else {
      key = keysDictionary[externalId]
    }
  }
  return key
}

module.exports = {
  mapToId,
}
