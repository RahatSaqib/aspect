import _ from 'lodash'
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

const cssClasses = classnames.bind(require('./BrowseFilters.css'))

const enhance = compose(
  pure,
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    return {
      filters: _.fromPairs([...filtersParams.entries()]),
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
      userFeatures: state.user.jwt.features,
    }),
    bindActionCreators.bind(null, {
      askExportConfirmation,
      closeExportConfirmation,
      beginListExportProcessing,
    })
  ),
  lifecycle({
    componentWillMount() {
      const reducedNav = reduceNavLinks(
        navigations,
        this.props.userPermissions,
        this.props.userFeatures
      )
      this.setState({
        reducedSource: reducedNav,
      })
    },
  })
)

export const BrowseFilters = ({
  history,
  location,
  intl,
  onRemoveFilterItem,
  reducedSource,
  userPermissions,
  ...restProps
}) => (
  <div className={cssClasses('Container')}>
    <FiltersBtnGroup
      intl={intl}
      filters={restProps.filters}
      onRemoveFilterItem={onRemoveFilterItem}
      className={cssClasses('FiltersBtnGroup')}
    >
      <BrowseNavDropdown
        history={history}
        location={location}
        source={reducedSource}
      />
    </FiltersBtnGroup>
    <FiltersPanel
      intl={intl}
      className={cssClasses('FiltersPanel')}
      {...restProps}
    />
  </div>
)

export const navigations = [
  {
    value: '/browse/device',
    label: 'Devices',
    requiredPermissions: ['device:view', 'device:admin', 'device:edit'],
    requiredFeatures: ['deviceList:true'],
  },
  {
    value: '/browse/result',
    label: 'Results',
    requiredPermissions: ['result:view', 'result:admin', 'result:edit'],
    requiredFeatures: ['resultList:true'],
  },
  {
    value: '/browse/person',
    label: 'Contacts',
    requiredPermissions: ['person:view', 'person:admin', 'person:edit'],
    requiredFeatures: ['personList:true'],
  },
  {
    value: '/browse/site',
    label: 'Sites',
    requiredPermissions: ['site:view', 'site:admin', 'site:edit'],
    requiredFeatures: ['siteList:true'],
  },
  {
    value: '/browse/inventory',
    label: 'Supplies',
    requiredPermissions: [
      'inventory:view',
      'inventory:admin',
      'inventory:edit',
    ],
    requiredFeatures: ['inventoryList:true'],
  },
  {
    value: '/browse/router',
    label: 'Routers',
    requiredPermissions: ['device:view', 'device:admin', 'device:edit'],
    requiredFeatures: ['routerList:true'],
  },
  {
    value: '/browse/reporter',
    label: 'Reporters',
    requiredPermissions: ['device:view', 'device:admin', 'device:edit'],
    requiredFeatures: ['reporterList:true'],
  },
  {
    value: '/browse/notification',
    label: 'Notifications',
    requiredPermissions: [
      'notification:view',
      'notification:admin',
      'notification:edit',
    ],
    requiredFeatures: ['notificationList:true'],
  },
  {
    value: '/browse/report',
    label: 'Reports',
    requiredPermissions: ['report:view', 'report:admin', 'report:edit'],
    requiredFeatures: ['reportsList:true'],
  },
  {
    value: '/browse/deviceApiKey',
    label: 'Device API Keys',
    requiredPermissions: [
      'deviceApiKey:view',
      'deviceApiKey:admin',
      'deviceApiKey:edit',
    ],
    requiredFeatures: ['deviceApiKey:true'],
  },
]

export default enhance(BrowseFilters)
