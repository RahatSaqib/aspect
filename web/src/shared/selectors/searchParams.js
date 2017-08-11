const DEFAULT_SORT_COL = 'id'
const DEFAULT_SORT_DIR = 'asc'
const DEFAULT_PAGE_AT = 0
const DEFAULT_PAGE_SIZE = 10

export const makeSortPageSelector = (
  {
    sortCol: defaultSortCol = DEFAULT_SORT_COL,
    sortDir: defaultSortDir = DEFAULT_SORT_DIR,
    pageAt: defaultPageAt = DEFAULT_PAGE_AT,
    pageSize: defaultPageSize = DEFAULT_PAGE_SIZE,
  } = {}
) => ({ location }) => {
  const searchParams = new URLSearchParams(location.search)
  return {
    sortCol: searchParams.get('sortCol') || defaultSortCol,
    sortDir: searchParams.get('sortDir') || defaultSortDir,
    pageAt: parseInt(searchParams.get('pageAt'), 10) || defaultPageAt,
    pageSize: parseInt(searchParams.get('pageSize'), 10) || defaultPageSize,
  }
}

export const makeSearchParamsSanitizer = (
  { availableSortCol = ['id'], availableSortDir = ['asc', 'desc'] } = {}
) => location => {
  const searchParams = new URLSearchParams(location.search)
  let sanitized = false
  if (
    searchParams.has('sortCol') &&
    availableSortCol.indexOf(searchParams.get('sortCol')) === -1
  ) {
    sanitized = true
    searchParams.delete('sortCol')
  }
  if (
    searchParams.has('sortDir') &&
    availableSortDir.indexOf(searchParams.get('sortDir')) === -1
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
