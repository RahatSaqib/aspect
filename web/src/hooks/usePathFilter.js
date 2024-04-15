import { useCallback, useContext, useMemo } from 'react'
import get from 'lodash/get'
import isNil from 'lodash/isNil'
import omit from 'lodash/omit'
import { useLocation } from 'react-router'
import FilterContext from '../providers/FilterProvider/FilterProvider.Context'

const getByPath = (filter, pathname) => omit(get(filter, pathname.split('#')[0], {}), isNil)

export function usePathFilter() {
  const { pathname } = useLocation()

  const [filter, setFilter] = useContext(FilterContext)

  if (filter === undefined) throw new Error('useFilter must be used within a FilterProvider')

  const set = useCallback(
    setter => {
      setFilter(prv => {
        if (typeof setter === 'function') {
          const prevPathState = getByPath(prv, pathname)
          return { ...prv, [pathname]: setter({ ...prevPathState }) }
        }
        return { ...prv, [pathname]: setter }
      })
    },
    [pathname, setFilter]
  )

  const value = useMemo(() => getByPath(filter, pathname), [filter, pathname])

  return [value, set]
}
