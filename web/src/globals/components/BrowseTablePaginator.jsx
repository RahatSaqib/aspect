import { compose, withHandlers, pure } from 'recompose'

import TablePaginator from '../../components/shared/TablePaginator'

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

    onPageSizeChange: ({ history, location }) => nextPageSize => {
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('pageSize', nextPageSize)
      searchParams.set('pageAt', 0)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
  })
)

export default enhance(TablePaginator)
