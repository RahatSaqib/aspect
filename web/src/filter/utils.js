import _ from 'lodash'

// eslint-disable-next-line import/prefer-default-export
export function nonEmptyFilterValue(x) {
  return !_.isNull(x) && !_.isUndefined(x) && x !== ''
}
