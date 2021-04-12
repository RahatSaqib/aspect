import fromPairs from 'lodash/fromPairs'
import replace from 'lodash/replace'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, pure, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
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
      filters: fromPairs([...filtersParams.entries()]),
      dateFormat: replace(prefs.get('dateFormat'), /-/g, '/'),
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
  dateFormat,
  showBrowseDropdown = true,
  ...restProps
}) => (
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

export const navigations = [
  {
    value: '/browse/device',
    label: 'Devices',
    i18nKey: 'devices',
    requiredPermissions: ['device'],
  },
  {
    value: '/browse/result',
    label: 'Results',
    i18nKey: 'results',
    requiredPermissions: ['result'],
  },
  {
    value: '/browse/case',
    label: 'Cases',
    i18nKey: 'cases',
    requiredPermissions: ['case'],
  },
  {
    value: '/browse/person',
    label: 'Contacts',
    i18nKey: 'contacts',
    requiredPermissions: ['person'],
  },
  {
    value: '/browse/site',
    label: 'Sites',
    i18nKey: 'sites',
    requiredPermissions: ['site'],
  },
  {
    value: '/browse/inventory',
    label: 'Supplies',
    i18nKey: 'supplies',
    requiredPermissions: ['inventory'],
  },
  {
    value: '/browse/router',
    label: 'Routers',
    i18nKey: 'routers',
    requiredPermissions: ['router'],
  },
  {
    value: '/browse/reporter',
    label: 'Reporters',
    i18nKey: 'reporters',
    requiredPermissions: ['reporter'],
  },
  {
    value: '/browse/notification',
    label: 'Notifications',
    i18nKey: 'notifications',
    requiredPermissions: ['notification'],
  },
  {
    value: '/browse/deviceApiKey',
    label: 'Device Api Key',
    i18nKey: 'deviceApiKey',
    requiredPermissions: ['deviceApiKey'],
  },
]

export default enhance(BrowseFilters)
