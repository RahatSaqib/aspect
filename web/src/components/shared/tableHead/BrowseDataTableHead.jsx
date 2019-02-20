import React, { useCallback } from 'react'
import DataTableHead from './DataTableHead'

export const useSortFilter = ({
  history,
  location,
  sortColumnKey: sortCol,
  sortColumnDir: sortDir,
}) => {
  const onSortColumn = useCallback(
    nextSortCol => {
      const searchParams = new URLSearchParams(location.search)

      if (sortCol !== nextSortCol) {
        searchParams.set('sortCol', nextSortCol)
      } else {
        searchParams.set('sortDir', sortDir !== 'asc' ? 'asc' : 'desc')
      }
      searchParams.set('pageAt', 0)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
    [sortCol, sortDir]
  )
  return { onSortColumn }
}

const BrowseDataTableHead = ({
  history,
  location,
  onHeadColumnClick,
  ...restProps
}) => {
  const { sortColumnKey, sortColumnDir } = restProps
  const { onSortColumn } = useSortFilter({
    history,
    location,
    sortColumnKey,
    sortColumnDir,
  })
  return <DataTableHead onHeadColumnClick={onSortColumn} {...restProps} />
}

export default BrowseDataTableHead
