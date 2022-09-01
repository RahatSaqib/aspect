import replace from 'lodash/replace'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, pure, lifecycle } from 'recompose'
import { connect } from 'react-redux'
import BrowseNavDropdown from './BrowseNavDropdown'
import { getFilters, mergeToFiltersParams, reduceNavLinks } from './filter/utils'
import FiltersBtnGroup from './filter/btnGroup/FiltersBtnGroup'
import FiltersPanel from './filter/popover/FiltersPanel'
import {
  exportFormatTypes,
  askExportConfirmation,
  closeExportConfirmation,
  beginListExportProcessing,
} from '../store/FilterRedux'
import { getAspectDisplayPreferences } from '../utils/LocalStorage'

import styles from './BrowseFilters.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  pure,
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    const prefs = getAspectDisplayPreferences()
    const filters = getFilters(filtersParams)
    return {
      filters,
      dateFormat: replace(prefs.get('dateFormat'), /-/g, '/'),
    }
  }),
  withHandlers({
    onChangeFilters:
      ({ navigate, location }) =>
      nextFilters => {
        const searchParams = new URLSearchParams(location.search)
        const filtersParams = mergeToFiltersParams(nextFilters, new URLSearchParams(searchParams.get('filters') || ''))
        searchParams.set('filters', filtersParams)
        searchParams.delete('pageAt')
        searchParams.delete('page')
        navigate(
          {
            ...location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      },

    onRemoveFilterItem:
      ({ navigate, location }) =>
      (filterKey, index) => {
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

        navigate(
          {
            ...location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      },
  }),
  connect(
    state => ({
      listExport: state.filter.listExport,
      exportFormatTypes,
      userPermissions: state.user.jwt.permissions,
    }),
    {
      askExportConfirmation,
      closeExportConfirmation,
      beginListExportProcessing,
    }
  ),
  lifecycle({
    UNSAFE_componentWillMount() {
      const reducedNav = reduceNavLinks(navigations, this.props.userPermissions)
      this.setState({
        reducedSource: reducedNav,
      })
    },
  })
)

export const BrowseFilters = ({
  children,
  navigate,
  location,
  onRemoveFilterItem,
  reducedSource,
  dateFormat,
  showBrowseDropdown = true,
  ...restProps
}) => (
  <div className={cssClasses('Container')}>
    <FiltersBtnGroup
      filters={restProps.filters}
      onRemoveFilterItem={onRemoveFilterItem}
      className={cssClasses('FiltersBtnGroup')}
    >
      {showBrowseDropdown && <BrowseNavDropdown navigate={navigate} location={location} source={reducedSource} />}
    </FiltersBtnGroup>
    {children}

    <FiltersPanel className={cssClasses('FiltersPanel')} dateFormat={dateFormat} {...restProps} />
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
    label: 'Device Api Keys',
    i18nKey: 'deviceApiKey',
    requiredPermissions: ['deviceApiKey'],
  },
]

export default enhance(BrowseFilters)
