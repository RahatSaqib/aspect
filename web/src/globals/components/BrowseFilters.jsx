import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import BrowseNavDropdown from './BrowseNavDropdown'
import { mergeToFiltersParams } from '../../filter/utils'
import FiltersBtnGroup from '../../filter/btnGroup/FiltersBtnGroup'
import FiltersPanel from '../../filter/popover/FiltersPanel'
import {
  exportFormatTypes,
  askExportConfirmation,
  closeExportConfirmation,
  beginListExportProcessing,
} from '../../filter/FilterRedux'

const cssClasses = classnames.bind(require('./BrowseFilters.css'))

const enhance = compose(
  pure,
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters'))
    return {
      filters: _.fromPairs([...filtersParams.entries()]),
    }
  }),
  withHandlers({
    onChangeFilters: ({ history, location }) => nextFilters => {
      const searchParams = new URLSearchParams(location.search)

      const filtersParams = mergeToFiltersParams(
        nextFilters,
        new URLSearchParams(searchParams.get('filters'))
      )

      searchParams.set('filters', filtersParams)
      searchParams.delete('pageAt')

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },

    onRemoveFilterItem: ({ history, location }) => filterKey => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(searchParams.get('filters'))

      filtersParams.delete(filterKey)
      searchParams.set('filters', filtersParams)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
  }),
  connect(
    state => ({
      listExport: state.filter.listExport,
      exportFormatTypes,
    }),
    bindActionCreators.bind(null, {
      askExportConfirmation,
      closeExportConfirmation,
      beginListExportProcessing,
    })
  )
)

export const BrowseFilters = ({
  history,
  location,
  intl,
  onRemoveFilterItem,
  ...restProps
}) =>
  <div className={cssClasses('Container')}>
    <FiltersBtnGroup
      intl={intl}
      filters={restProps.filters}
      onRemoveFilterItem={onRemoveFilterItem}
      className={cssClasses('FiltersBtnGroup')}
    >
      <BrowseNavDropdown history={history} location={location} />
    </FiltersBtnGroup>
    <FiltersPanel
      intl={intl}
      className={cssClasses('FiltersPanel')}
      {...restProps}
    />
  </div>

export default enhance(BrowseFilters)
