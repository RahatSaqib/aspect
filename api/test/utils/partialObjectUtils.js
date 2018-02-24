const _ = require('lodash')
const chai = require('chai')

const { assert } = chai

function isPrimitive(value) {
  return (
    typeof value !== 'object' ||
    value instanceof Date ||
    value instanceof Boolean ||
    value instanceof Number ||
    value instanceof String ||
    value === null
  )
}

function isObject(value) {
  return (
    typeof value === 'object' &&
    !(value instanceof Date) &&
    !(value instanceof Boolean) &&
    !(value instanceof Number) &&
    !(value instanceof String) &&
    value !== null
  )
}

function isArray(value) {
  return value instanceof Array
}

function isFunction(value) {
  return typeof value === 'function'
}

function allNull(...rest) {
  return _.every(rest, value => value === null)
}

function allUndefined(...rest) {
  return _.every(rest, value => typeof value === 'undefined')
}

function allNullOrAllUndefined(...rest) {
  return allNull(rest) || allUndefined(rest)
}

function specifiedPropertiesEqual(actual, expected) {
  if (allNullOrAllUndefined(actual, expected)) {
    return true
  }
  return _.every(Object.keys(expected), key => {
    if (isPrimitive(expected[key])) {
      return expected[key] === actual[key]
    } else if (isArray(expected[key])) {
      return specifiedItemsEqual(expected[key], actual[key])
    } else if (isFunction(expected[key]) && isFunction(actual[key])) {
      return true
    }
    return specifiedPropertiesEqual(actual[key], expected[key])
  })
}

function specifiedItemsEqual(actual, expected) {
  if (allNullOrAllUndefined(actual, expected)) {
    return true
  } else if (!isArray(actual) || !isArray(expected)) {
    return false
  }
  if (actual.length !== expected.length) {
    return false
  }
  const clonedActual = _.cloneDeep(actual)
  const clonedExpected = _.reverse(
    _.orderBy(_.cloneDeep(expected), numberOfItemsSpecified)
  )
  return _.every(clonedExpected, expectedItem => {
    const matchingActualItem = _.find(clonedActual, actualItem => {
      if (isArray(actualItem) && isArray(expectedItem)) {
        return specifiedItemsEqual(actualItem, expectedItem)
      } else if (isPrimitive(expectedItem)) {
        return actualItem === expectedItem
      }
      return specifiedPropertiesEqual(actualItem, expectedItem)
    })
    if (!matchingActualItem) {
      return false
    }
    _.pull(clonedActual, matchingActualItem)
    return true
  })
}

function numberOfItemsSpecified(thing) {
  if (thing === null || typeof thing === 'undefined') {
    return 0
  }
  if (isArray(thing)) {
    return _.sum(thing, numberOfItemsSpecified)
  }
  if (isPrimitive(thing)) {
    return 1
  }
  return _.sum(_.mapValues(thing, numberOfItemsSpecified))
}

function assertSpecifiedItemsEqual(actual, expected) {
  const areEqual = isArray(expected)
    ? specifiedItemsEqual(actual, expected)
    : specifiedPropertiesEqual(actual, expected)
  if (!areEqual) {
    const message = `expected specified members of ${expected} to equal those of ${actual}`
    assert.deepEqual(
      actual,
      _.merge(isArray(expected) ? [] : {}, actual, expected),
      message
    )
    assert.deepEqual(actual, expected, message)
    assert.fail(actual, expected, message)
  }
}

module.exports = {
  assertSpecifiedItemsEqual,
}
