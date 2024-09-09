const { isPlainObject, isObject, forOwn, isArray, sortBy, isDate, padStart } = require('lodash')

function jsonToArraySorted(json) {
  /**
   * Helper function to recursively process the JSON object and return a flattened array.
   */
  const getList = (obj, prefix = '') => {
    let arr = []

    forOwn(obj, (value, propName) => {
      const key = prefix ? `${prefix}|${propName}` : propName

      if (isDate(value) || !isObject(value)) {
        arr.push({ key, value })
      } else if (isPlainObject(value)) {
        arr = arr.concat(getList(value, key))
      } else if (isArray(value)) {
        if (value.length === 0) {
          arr.push({ key, value })
        } else {
          value.forEach((item, index) => {
            const keyItem = `${key}|${padStart(index, 2, '0')}`
            if (isPlainObject(item)) {
              arr = arr.concat(getList(item, keyItem))
            } else {
              arr.push({ key: keyItem, value: item })
            }
          })
        }
      }
    })

    return arr
  }

  /**
   * Get the flattened list and sort by the `key` property.
   */
  return sortBy(getList(json), 'key')
}

module.exports = { jsonToArraySorted }
