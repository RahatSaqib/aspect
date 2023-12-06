import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import useAuthState from './useAuthState'
import useFilterValues from './useFilterValues'

const useFilterSync = () => {
  const user = useAuthState()
  const { pathname } = useLocation()
  const filter = useFilterValues(pathname)
  const [state, setState] = useState()
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (state) {
      if (!filter.countryId) {
        const diff = Object.keys(state).length - Object.keys(filter).length
        if (dirty && diff > 1) {
          // if diff > 1 filter was reset and we need to update state (countryId doesnt count)
          setState({ ...filter, countryId: user.countryId })
        }
      } else {
        setDirty(true) // apply filter was clicked
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  return [state || { ...filter, countryId: user.countryId }, setState]
}

export default useFilterSync
