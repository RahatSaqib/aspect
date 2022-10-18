import { compose, withHandlers, pure } from 'recompose'
import TablePaginator from './shared/TablePaginator'

export * from './shared/TablePaginator'

const enhance = compose(
  pure,
  withHandlers({
    onPageChange:
      ({ navigate, location }) =>
      nextPage => {
        const searchParams = new URLSearchParams(location.search)
        searchParams.set('pageAt', nextPage)

        navigate(
          {
            ...location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      },

    onPageSizeChange:
      ({ navigate, location, pageAt, pageSize }) =>
      nextPageSize => {
        const searchParams = new URLSearchParams(location.search)
        searchParams.set('pageSize', nextPageSize)
        searchParams.set('pageAt', Math.floor((pageAt * pageSize) / nextPageSize))

        navigate(
          {
            ...location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      },
  })
)

export default enhance(TablePaginator)
