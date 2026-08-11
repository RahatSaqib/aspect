import React from 'react'
import TablePaginator from './shared/TablePaginator'

export * from './shared/TablePaginator'

const BrowseTablePaginator = ({ navigate, location, pageAt, pageSize, ...restProps }) => {
  const gotoSearchParams = searchParams =>
    navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })

  const onPageChange = nextPage => {
    const searchParams = new URLSearchParams(location.search)
    searchParams.set('pageAt', nextPage)
    gotoSearchParams(searchParams)
  }

  const onPageSizeChange = nextPageSize => {
    const searchParams = new URLSearchParams(location.search)
    searchParams.set('pageSize', nextPageSize)
    searchParams.set('pageAt', Math.floor((pageAt * pageSize) / nextPageSize))
    gotoSearchParams(searchParams)
  }

  return (
    <TablePaginator
      {...restProps}
      pageAt={pageAt}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  )
}

export default React.memo(BrowseTablePaginator)
