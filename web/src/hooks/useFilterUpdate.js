import { useContext } from 'react'
import { defaultFilter } from '../providers/FilterProvider/FilterProvider'
import FilterContext from '../providers/FilterProvider/FilterProvider.Context'

function useFilterUpdate() {
  const [filter, setFilter] = useContext(FilterContext)

  if (filter === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }

  const update = (newFilter, pathname) => setFilter({ ...filter, [pathname]: { ...newFilter } })
  const addMultipleFilter = filters => {
    // Combine all new filters into a single object
    const updatedFilters = filters.reduce((acc, { newFilter, pathname }) => {
      return { ...acc, [pathname]: { ...newFilter } }
    }, {})
    // Update the state once with all the new filters
    setFilter(prevFilter => ({ ...prevFilter, ...updatedFilters }))
  }

  const removeFilter = (keys, pathname) => {
    const filterForLocation = filter[pathname]
    keys.forEach(k => {
      if (k.includes('.')) {
        const [key, value] = k.split('.')
        filterForLocation[key] = filterForLocation[key].filter(v => v !== value)
      } else {
        delete filterForLocation[k]
      }
    })

    update(filterForLocation, pathname)
  }

  const resetFilter = pathname => setFilter({ ...filter, [pathname]: { ...defaultFilter[pathname] } })

  return [update, removeFilter, resetFilter, addMultipleFilter] // pathname is to allow changing the filter in other places before navigation
}

export default useFilterUpdate
