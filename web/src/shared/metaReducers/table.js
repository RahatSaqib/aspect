/*
  This is a generic reducer for a list of things that are
  to be loaded in a pageable, sortable grid
*/
import Immutable from 'immutable'

export function requestTable(table, action) {
  return table.merge({
    loading: true,
    sortCol: action.sortCol,
    sortDir: action.sortDir,
    page: action.page,
    pageSize: action.size,
    filters: action.filters
  })
}

export function receiveTableItems(table, total, extraColumns) {
  return table.merge({
    loading: false,
    total,
    extraColumns
  })
}

export const Table = Immutable.Record({
  loading: false,
  sortCol: 'name',
  sortDir: 'asc',
  page: 0,
  pageSize: 10, // Renamed from 'size' since 'size' will conflict with Immutable internal property
  total: 0,
  filters: Immutable.fromJS({ name: '' }),
  extraColumns: new Immutable.List()
})
