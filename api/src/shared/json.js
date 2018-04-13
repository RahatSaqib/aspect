const _ = require('lodash')

function isJson(item) {
  item = typeof item !== 'string' ? JSON.stringify(item) : item
  try {
    item = JSON.parse(item)
  } catch (e) {
    return false
  }
  if (typeof item === 'object' && item !== null) {
    return true
  }
  return false
}

function deepMerger(to, from) {
  if (_.isObject(to)) {
    return _.mergeWith(to, from, deepMerger)
  }
  if (
    (_.isNull(to) || _.isUndefined(to)) &&
    !(_.isNull(from) || _.isUndefined(from))
  ) {
    return from
  }
  if (
    (_.isNull(from) || _.isUndefined(from)) &&
    !(_.isNull(to) || _.isUndefined(to))
  ) {
    return to
  }
  if (_.isEmpty(to) && !_.isEmpty(from)) {
    return from
  }
  if (_.isEmpty(from) && !_.isEmpty(to)) {
    return to
  }
}

function deepMerge(to, from) {
  return _.mergeWith(to, from, deepMerger)
}

module.exports = {
  isJson,
  deepMerge,
}
