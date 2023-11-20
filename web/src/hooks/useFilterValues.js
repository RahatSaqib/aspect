import { useContext } from 'react'
import FilterContext from '../providers/FilterProvider/FilterProvider.Context'

const useFilterValues = pathname => {
  const [filter] = useContext(FilterContext)

  if (filter === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }

  if (pathname) {
    const cleanPath = pathname.split('#')[0]

    if (Object.keys(filter).includes(cleanPath)) {
      // eslint-disable-next-line no-unused-vars
      return Object.fromEntries(Object.entries(filter[cleanPath]).filter(([_, v]) => v != null)) // remove nulls
    }
  }
  return {}
}

export default useFilterValues
