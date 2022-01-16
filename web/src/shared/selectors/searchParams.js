import isNaN from 'lodash/isNaN'

export const DEFAULT_SORT_COL = 'id'
export const DEFAULT_SORT_DIR = 'asc'
export const DEFAULT_PAGE_AT = 0
export const DEFAULT_PAGE_SIZE = 10

export const makeSortPageSelector =
  ({
    sortCol: defaultSortCol = DEFAULT_SORT_COL,
    sortDir: defaultSortDir = DEFAULT_SORT_DIR,
    pageAt: defaultPageAt = DEFAULT_PAGE_AT,
    pageSize: defaultPageSize = DEFAULT_PAGE_SIZE,
  } = {}) =>
  ({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const pageParamName = searchParams.has('pageAt') ? 'pageAt' : 'page'
    const sizeParamName = searchParams.has('pageSize') ? 'pageSize' : 'size'
    const page = parseInt(searchParams.get(pageParamName), 10)
    const size = parseInt(searchParams.get(sizeParamName), 10)
    return {
      sortCol: searchParams.get('sortCol') || defaultSortCol,
      sortDir: searchParams.get('sortDir') || defaultSortDir,
      pageAt: isNaN(page) ? defaultPageAt : page,
      pageSize: isNaN(size) ? defaultPageSize : size,
    }
  }

export const makeSearchParamsSanitizer =
  ({ availableSortCol = ['id'], availableSortDir = ['asc', 'desc'] } = {}) =>
  location => {
    const searchParams = new URLSearchParams(location.search)
    let sanitized = false
    if (
      searchParams.has('sortCol') &&
      !availableSortCol.includes(searchParams.get('sortCol'))
    ) {
      sanitized = true
      searchParams.delete('sortCol')
    }
    if (
      searchParams.has('sortDir') &&
      !availableSortDir.includes(searchParams.get('sortDir'))
    ) {
      sanitized = true
      searchParams.delete('sortDir')
    }
    return {
      sanitized,
      value: searchParams,
    }
  }

export const composeSanitizer = (f, g) => x => {
  const { sanitized: sanitizedG, value: temp } = g(x)
  const { sanitized: sanitizedF, value } = f(temp)
  return {
    sanitized: sanitizedF || sanitizedG,
    value,
  }
}
