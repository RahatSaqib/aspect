import React, { useState, createContext } from 'react'

const FilterContext = createContext()

const defaultFilter = {
  '/browse/site': { countryId: 4 },
  '/browse/person': { countryId: 4, contactStatus: 0 },
}

function FilterProvider({ children }) {
  const filterState = useState(defaultFilter)
  // NOTE: you *might* need to memoize this value
  // Learn more in http://kcd.im/optimize-context
  return <FilterContext.Provider value={filterState}>{children}</FilterContext.Provider>
}

function useFilter(pathname) {
  const [filter, setFilter] = React.useContext(FilterContext)

  if (filter === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }

  const updateCurrentFilter = newFilter => setFilter({ ...filter, [pathname]: newFilter })

  return [filter[pathname], updateCurrentFilter] // access and update current url/page/section filters
}

export { FilterProvider, useFilter }
