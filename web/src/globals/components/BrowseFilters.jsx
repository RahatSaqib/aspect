import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import BrowseNavDropdown from './BrowseNavDropdown'
import FiltersBtnGroup from '../../filter/btnGroup/FiltersBtnGroup'
import ListFiltersPanel from '../../filter/popover/ListFiltersPanel'

const cssClasses = classnames.bind(require('./BrowseFilters.css'))

const enhance = _.identity

export const BrowseFilters = ({
  history,
  location,
  intl,
  dateFilterLabel,
  onClickExport,
  askConfirmationForExport,
}) =>
  <div className={cssClasses('Container')}>
    <FiltersBtnGroup className={cssClasses('FiltersBtnGroup')} intl={intl}>
      <BrowseNavDropdown history={history} location={location} />
    </FiltersBtnGroup>
    <ListFiltersPanel
      className={cssClasses('ListFiltersPanel')}
      dateFilterLabel={dateFilterLabel}
      onClickExport={onClickExport}
      askConfirmationForExport={askConfirmationForExport}
    />
  </div>

export default enhance(BrowseFilters)
