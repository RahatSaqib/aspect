import _ from 'lodash'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import BrowseNavDropdown from './BrowseNavDropdown'
import FiltersBtnGroup from '../../filter/btnGroup/FiltersBtnGroup'
import FiltersPanel from '../../filter/popover/FiltersPanel'
import {
  exportFormatTypes,
  clearListFilter,
  changeListFilter,
  askExportConfirmation,
  closeExportConfirmation,
  beginListExportProcessing,
} from '../../filter/FilterRedux'

const cssClasses = classnames.bind(require('./BrowseFilters.css'))

const enhance = compose(
  pure,
  connect(
    state => ({
      config: state.filter.listConfig,
      filters: state.filter.listFilter,
      listExport: state.filter.listExport,
      exportFormatTypes,
    }),
    bindActionCreators.bind(null, {
      onClearFilter: clearListFilter,
      onChangeFilter: _.flowRight(changeListFilter, Immutable.fromJS),

      askExportConfirmation,
      closeExportConfirmation,
      beginListExportProcessing,
    })
  )
)

export const BrowseFilters = ({ history, location, intl, ...restProps }) =>
  <div className={cssClasses('Container')}>
    <FiltersBtnGroup className={cssClasses('FiltersBtnGroup')} intl={intl}>
      <BrowseNavDropdown history={history} location={location} />
    </FiltersBtnGroup>
    <FiltersPanel
      className={cssClasses('FiltersPanel')}
      intl={intl}
      {...restProps}
    />
  </div>

export default enhance(BrowseFilters)
