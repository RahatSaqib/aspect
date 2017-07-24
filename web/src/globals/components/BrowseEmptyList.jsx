import { compose, withHandlers, pure } from 'recompose'

import EmptyList from '../../components/shared/EmptyList'

const enhance = compose(
  pure,
  withHandlers({
    onClearFilters: ({ history, location }) => () => {
      const searchParams = new URLSearchParams(location.search)
      searchParams.delete('filters')

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
  })
)

export default enhance(EmptyList)
