import React, { useCallback } from 'react'
import DataTableHead from './DataTableHead'

export const useSortFilter = ({ navigate, location, sortColumnKey: sortCol, sortColumnDir: sortDir }) => {
  const onSortColumn = useCallback(
    nextSortCol => {
      const searchParams = new URLSearchParams(location.search)

      if (sortCol !== nextSortCol) {
        searchParams.set('sortCol', nextSortCol)
      } else {
        searchParams.set('sortDir', sortDir !== 'asc' ? 'asc' : 'desc')
      }
      searchParams.set('pageAt', 0)

      navigate(
        {
          ...location,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      )
    },
    [navigate, location, sortCol, sortDir]
  )
  return { onSortColumn }
}

const BrowseDataTableHead = ({ navigate, location, ...restProps }) => {
  const { sortColumnKey, sortColumnDir } = restProps
  const { onSortColumn } = useSortFilter({
    navigate,
    location,
    sortColumnKey,
    sortColumnDir,
  })
  return <DataTableHead onHeadColumnClick={onSortColumn} {...restProps} />
}

export default BrowseDataTableHead
