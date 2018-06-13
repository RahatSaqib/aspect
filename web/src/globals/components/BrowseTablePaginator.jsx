import { compose, withHandlers, pure } from 'recompose'

import TablePaginator from '../../components/shared/TablePaginator'

export * from '../../components/shared/TablePaginator'

const enhance = compose(
  pure,
  withHandlers({
    onPageChange: ({ history, location }) => nextPage => {
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('pageAt', nextPage)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },

    onPageSizeChange: ({
      history,
      location,
      pageAt,
      pageSize,
    }) => nextPageSize => {
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('pageSize', nextPageSize)
      searchParams.set('pageAt', Math.floor(pageAt * pageSize / nextPageSize))

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
  })
)

export default enhance(TablePaginator)
