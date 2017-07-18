import _ from 'lodash'

export function nonEmptyFilterValue(x) {
  return !_.isNull(x) && !_.isUndefined(x) && x !== ''
}

export const mergeToFiltersParams = (filters, filtersParams) =>
  _.reduce(
    filters,
    (filtersParams, v, k) => {
      if (nonEmptyFilterValue(v)) {
        filtersParams.set(k, v)
      } else {
        filtersParams.delete(k)
      }
      return filtersParams
    },
    filtersParams
  )
