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
  ({ location, availableSortCol, dependencies }) => {
    const searchParams = new URLSearchParams(location.search)

    const pageParamName = searchParams.has('pageAt') ? 'pageAt' : 'page'
    const sizeParamName = searchParams.has('pageSize') ? 'pageSize' : 'size'
    const page = parseInt(searchParams.get(pageParamName), 10) || defaultPageAt
    const size = parseInt(searchParams.get(sizeParamName), 10) || defaultPageSize
    const sortCol = searchParams.get('sortCol')

    let index = -1
    let obj = null

    // If the available columns are defined, then only sort and page by the allowed fields
    if (availableSortCol) {
      index = availableSortCol.indexOf(sortCol)
      obj = availableSortCol.find(c => c.col === sortCol)

      // If the sortCol is not defined as an available sorting col or it's disabled, then return the default ordering
      if ((index === -1 && !obj) || (dependencies && obj && obj.isEnabled && obj.isEnabled(dependencies) === false))
        return {
          sortCol: defaultSortCol,
          sortDir: defaultSortDir,
          pageAt: page,
          pageSize: size,
        }
    }

    return {
      sortCol: searchParams.get('sortCol') || defaultSortCol,
      sortDir: searchParams.get('sortDir') || defaultSortDir,
      pageAt: isNaN(page) ? defaultPageAt : page,
      pageSize: isNaN(size) ? defaultPageSize : size,
    }
  }

export const makeSearchParamsSanitizer =
  ({ availableSortCol = ['id'], availableSortDir = ['asc', 'desc'] } = {}) =>
  (location, dependencies) => {
    const searchParams = new URLSearchParams(location.search)
    let sanitized = false
    if (searchParams.has('sortCol')) {
      let shouldDelete = false

      const index = availableSortCol.indexOf(searchParams.get('sortCol'))
      const obj = availableSortCol.find(c => c.col === searchParams.get('sortCol'))

      if (index === -1 && !obj) shouldDelete = true
      else if (dependencies && obj && obj.isEnabled && obj.isEnabled(dependencies) === false) shouldDelete = true

      if (shouldDelete) {
        sanitized = true
        searchParams.delete('sortCol')
      }
    }

    if (searchParams.has('sortDir') && !availableSortDir.includes(searchParams.get('sortDir'))) {
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
