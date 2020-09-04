import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, pure, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Report from '../../dashboard/status/Reports'
import BrowseNavDropdown from './BrowseNavDropdown'
import { mergeToFiltersParams, reduceNavLinks } from '../../filter/utils'
import FiltersBtnGroup from '../../filter/btnGroup/FiltersBtnGroup'
import FiltersPanel from '../../filter/popover/FiltersPanel'
import {
  exportFormatTypes,
  askExportConfirmation,
  closeExportConfirmation,
  beginListExportProcessing,
} from '../../filter/FilterRedux'
import { getAspectDisplayPreferences } from '../sideEffects/LocalStorage'

const cssClasses = classnames.bind(require('./BrowseFilters.css'))

const enhance = compose(
  pure,
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    const prefs = getAspectDisplayPreferences()
    return {
      filters: _.fromPairs([...filtersParams.entries()]),
      dateFormat: _.replace(prefs.get('dateFormat'), /-/g, '/'),
    }
  }),
  withHandlers({
    onChangeFilters: ({ history, location }) => nextFilters => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = mergeToFiltersParams(
        nextFilters,
        new URLSearchParams(searchParams.get('filters') || '')
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
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )

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
        default:
          filtersParams.delete(filterKey)
          break
      }

      searchParams.set('filters', filtersParams)
      searchParams.delete('sortCol')

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
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      askExportConfirmation,
      closeExportConfirmation,
      beginListExportProcessing,
    })
  ),
  lifecycle({
    componentWillMount() {
      const reducedNav = reduceNavLinks(navigations, this.props.userPermissions)
      this.setState({
        reducedSource: reducedNav,
      })
    },
  })
)

export const BrowseFilters = ({
  children,
  history,
  location,
  intl,
  onRemoveFilterItem,
  reducedSource,
  userPermissions,
  dateFormat,
  showBrowseDropdown = true,
  ...restProps
}) => {
  return (
    <div className={cssClasses('Container')}>
      <FiltersBtnGroup
        intl={intl}
        filters={restProps.filters}
        onRemoveFilterItem={onRemoveFilterItem}
        className={cssClasses('FiltersBtnGroup')}
      >
        {showBrowseDropdown && (
          <BrowseNavDropdown
            history={history}
            location={location}
            source={reducedSource}
          />
        )}
      </FiltersBtnGroup>
      {children}

      <FiltersPanel
        intl={intl}
        className={cssClasses('FiltersPanel')}
        dateFormat={dateFormat}
        {...restProps}
      />
    </div>
  )
}

export const navigations = [
  {
    value: '/browse/device',
    label: 'Devices',
    requiredPermissions: ['browse', 'device'],
  },
  {
    value: '/browse/result',
    label: 'Results',
    requiredPermissions: ['browse', 'result'],
  },
  {
    value: '/browse/case',
    label: 'Cases',
    requiredPermissions: ['browse', 'case'],
  },
  {
    value: '/browse/person',
    label: 'Contacts',
    requiredPermissions: ['browse', 'person'],
  },
  {
    value: '/browse/site',
    label: 'Sites',
    requiredPermissions: ['browse', 'site'],
  },
  {
    value: '/browse/inventory',
    label: 'Supplies',
    requiredPermissions: ['browse', 'inventory'],
  },
  {
    value: '/browse/router',
    label: 'Routers',
    requiredPermissions: ['browse', 'router'],
  },
  {
    value: '/browse/reporter',
    label: 'Reporters',
    requiredPermissions: ['browse', 'reporter'],
  },
  {
    value: '/browse/notification',
    label: 'Notifications',
    requiredPermissions: ['browse', 'notification'],
  },
  {
    value: '/browse/deviceApiKey',
    label: 'Device Api Key',
    requiredPermissions: ['browse', 'deviceApiKey'],
  },
]

export default enhance(BrowseFilters)
