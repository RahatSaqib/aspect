import { compose, withHandlers, pure } from 'recompose'

import EmptyList from '../../components/shared/EmptyList'

const enhance = compose(
  pure,
  withHandlers({
    onClearFilters:
      ({ navigate, location }) =>
      () => {
        const searchParams = new URLSearchParams(location.search)
        for (const key of searchParams.keys()) {
          searchParams.delete(key)
        }
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

export default enhance(EmptyList)
