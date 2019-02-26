import { compose, withHandlers, pure } from 'recompose'

import DataTableHead from '../../components/shared/DataTableHead'

const enhance = compose(
  pure,
  withHandlers({
    onSortColumn: ({
      history,
      location,
      sortColumnKey: sortCol,
      sortColumnDir: sortDir,
    }) => nextSortCol => {
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
  })
)

export default enhance(DataTableHead)
