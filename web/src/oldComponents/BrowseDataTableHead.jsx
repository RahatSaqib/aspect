import { compose, withHandlers, pure } from 'recompose'
import DataTableHead from '../../components/shared/tableHead/DataTableHead'

const enhance = compose(
  pure,
  withHandlers({
    onSortColumn:
      ({ navigate, location, sortColumnKey: sortCol, sortColumnDir: sortDir }) =>
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
  })
)

export default enhance(DataTableHead)
