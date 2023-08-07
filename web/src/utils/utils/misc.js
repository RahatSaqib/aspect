import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'

export function objectToArray(object) {
  return Object.entries(omitBy(object, isNil)).map(([name, value]) => ({ [name]: value }))
}
