import React from 'react'
import FiltersBtnGroup from './btnGroup/FiltersBtnGroup'
import FiltersPanel from './popover/FiltersPanel'
import { getFilters } from './utils'

export const BrowseFilters = ({ children, navigate, location, ...restProps }) => {
  const searchParams = new URLSearchParams(location.search)
  const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
  const filters = getFilters(filtersParams)

  const onRemoveFilterItem = (filterKey, index) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')

    switch (filterKey) {
      case 'countryId':
        filtersParams.delete(filterKey)
        filtersParams.delete('stateId')
        filtersParams.delete('lgaId')
        break
      case 'stateId':
        filtersParams.delete(filterKey)
        filtersParams.delete('lgaId')
        break
      case 'reportableSiteName':
        filtersParams.delete(filterKey)
        filtersParams.delete('reportableSiteId')
        break
      case 'assayId': {
        const values = filtersParams.getAll(filterKey)
        filtersParams.delete(filterKey)
        if (values.length > 1) {
          values.splice(index || 0, 1)
          values.forEach(value => {
            filtersParams.append(filterKey, value)
          })
        }
        if (!filtersParams.has(filterKey)) {
          filtersParams.delete('resultCategoryId')
          filtersParams.delete('resultCategory2Id')
          filtersParams.delete('resultCategoryGroupId')
        }
        break
      }
      case 'deviceMaintenanceStatusId': {
        const values = filtersParams.getAll(filterKey)
        filtersParams.delete(filterKey)
        if (values.length > 1) {
          values.splice(index || 0, 1)
          values.forEach(value => {
            filtersParams.append(filterKey, value)
          })
        }
        break
      }
      default:
        filtersParams.delete(filterKey)
        break
    }

    searchParams.set('filters', filtersParams)
    searchParams.delete('sortCol')

    navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
  }

  return (
    <>
      <FiltersBtnGroup filters={filters} onRemoveFilterItem={onRemoveFilterItem} />
      <div style={{ width: '178px', display: 'flex', alignItems: 'flex-start' }}>
        <FiltersPanel filters={filters} {...restProps} />
        {children}
      </div>
    </>
  )
}

export default BrowseFilters
